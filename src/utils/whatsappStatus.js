import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

const { StorageAccessFramework } = FileSystem;
const ANDROID_STATUSES_INITIAL_URI = 'content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp%2FWhatsApp%2FMedia%2F.Statuses';
const ANDROID_MEDIA_PARENT_URI = 'content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp%2FWhatsApp%2FMedia';
let STATUSES_DIR_URI = null;

/**
 * Solicita permissões necessárias para acessar o armazenamento
 * @returns {Promise<boolean>} - Se as permissões foram concedidas
 */
export const requestStoragePermissions = async () => {
  try {
    if (Platform.OS !== 'android') {
      Alert.alert('Não suportado', 'Esta funcionalidade está disponível apenas para Android.');
      return false;
    }

    // Solicita apenas permissão de mídia
    const mediaPermission = await MediaLibrary.requestPermissionsAsync();
    if (mediaPermission.status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar e salvar os status do WhatsApp.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissões:', error);
    return false;
  }
};

/**
 * Verifica se o diretório de status do WhatsApp existe
 * @returns {Promise<boolean>} - Se o diretório existe
 */
export const checkWhatsAppDirectory = async () => {
  try {
    if (Platform.OS !== 'android') return false;
    if (STATUSES_DIR_URI) return true;
    // First attempt: open directly at .Statuses
    let perm = await StorageAccessFramework.requestDirectoryPermissionsAsync(ANDROID_STATUSES_INITIAL_URI);
    if (perm.granted) {
      const picked = perm.directoryUri || '';
      if (decodeURIComponent(picked).toLowerCase().includes('/android/media/com.whatsapp/whatsapp/media/.statuses')) {
        STATUSES_DIR_URI = perm.directoryUri;
        return true;
      }
      Alert.alert(
        'Selecione a pasta correta',
        'Por favor navegue até Android > media > com.whatsapp > WhatsApp > Media > .Statuses e confirme.',
        [{ text: 'OK' }]
      );
    }

    // Fallback attempt: open at Media parent to let user navigate to .Statuses
    perm = await StorageAccessFramework.requestDirectoryPermissionsAsync(ANDROID_MEDIA_PARENT_URI);
    if (perm.granted) {
      const picked = perm.directoryUri || '';
      // If user picked the parent, reprompt with guidance; if they did navigate into .Statuses, accept
      const decoded = decodeURIComponent(picked).toLowerCase();
      if (decoded.endsWith('/android/media/com.whatsapp/whatsapp/media/.statuses') || decoded.includes('/android/media/com.whatsapp/whatsapp/media/.statuses')) {
        STATUSES_DIR_URI = perm.directoryUri;
        return true;
      }
      Alert.alert(
        'Selecione a pasta .Statuses',
        'Abrimos na pasta "Media". Entre na pasta oculta .Statuses e confirme o acesso.',
        [{ text: 'OK' }]
      );
      // One more prompt targeting exactly .Statuses
      const perm2 = await StorageAccessFramework.requestDirectoryPermissionsAsync(ANDROID_STATUSES_INITIAL_URI);
      if (perm2.granted) {
        const picked2 = decodeURIComponent(perm2.directoryUri || '').toLowerCase();
        if (picked2.includes('/android/media/com.whatsapp/whatsapp/media/.statuses')) {
          STATUSES_DIR_URI = perm2.directoryUri;
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar diretório do WhatsApp:', error);
    return false;
  }
};

/**
 * Obtém a lista de status do WhatsApp
 * @returns {Promise<Array>} - Lista de arquivos de status
 */
export const getWhatsAppStatuses = async () => {
  try {
    const hasPermission = await requestStoragePermissions();
    if (!hasPermission) return [];

    const dirOk = await checkWhatsAppDirectory();
    if (!dirOk || !STATUSES_DIR_URI) {
      Alert.alert(
        'Diretório não encontrado',
        'Não foi possível encontrar a pasta de status do WhatsApp. Verifique se o WhatsApp está instalado e se você visualizou alguns status recentemente.',
        [{ text: 'OK' }]
      );
      return [];
    }

    const uris = await StorageAccessFramework.readDirectoryAsync(STATUSES_DIR_URI);
    const mediaUris = uris.filter((u) => {
      const name = decodeURIComponent(u.split('/').pop() || '').toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.mp4', '.gif', '.webp'].some(ext => name.endsWith(ext));
    });

    const statusFiles = await Promise.all(
      mediaUris.map(async (uri) => {
        const nameRaw = decodeURIComponent(uri.split('/').pop() || 'status');
        const name = nameRaw.replace(/\?[^/]*$/, '');
        const lower = name.toLowerCase();
        const isVideo = lower.endsWith('.mp4');
        return {
          id: uri,
          uri,
          filename: name,
          type: isVideo ? 'video' : 'image',
          size: undefined,
          modificationTime: Date.now(),
          thumbnail: uri,
        };
      })
    );

    // Ordena por data de modificação (mais recentes primeiro)
    return statusFiles.sort((a, b) => b.modificationTime - a.modificationTime);
  } catch (error) {
    console.error('Erro ao obter status do WhatsApp:', error);
    return [];
  }
};

/**
 * Salva um arquivo de status na galeria
 * @param {Object} status - Objeto de status com informações do arquivo
 * @returns {Promise<boolean>} - Se o arquivo foi salvo com sucesso
 */
export const saveStatusToGallery = async (status) => {
  try {
    const hasPermission = await requestStoragePermissions();
    if (!hasPermission) return false;

    let sourceUri = status.uri;
    let localUri = sourceUri;
    if (sourceUri.startsWith('content://')) {
      const filename = status.filename || `status_${Date.now()}`;
      const ext = (filename.toLowerCase().split('.').pop() || '').replace(/[^a-z0-9]/g, '');
      const safeName = ext ? filename : `${filename}.mp4`;
      const cachePath = `${FileSystem.cacheDirectory}${safeName}`;
      const base64 = await StorageAccessFramework.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
      await FileSystem.writeAsStringAsync(cachePath, base64, { encoding: FileSystem.EncodingType.Base64 });
      localUri = cachePath;
    }

    const asset = await MediaLibrary.createAssetAsync(localUri);
    
    const album = await MediaLibrary.getAlbumAsync('ReelMate');
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync('ReelMate', asset, false);
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar status na galeria:', error);
    return false;
  }
};