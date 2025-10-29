import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

// Caminho para a pasta de status do WhatsApp no Android
const WHATSAPP_STATUS_PATH = FileSystem.documentDirectory + '../Android/media/com.whatsapp/WhatsApp/Media/.Statuses/';

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

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar seus arquivos para baixar os status do WhatsApp.',
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
    const dirInfo = await FileSystem.getInfoAsync(WHATSAPP_STATUS_PATH);
    return dirInfo.exists;
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

    const dirExists = await checkWhatsAppDirectory();
    if (!dirExists) {
      Alert.alert(
        'Diretório não encontrado',
        'Não foi possível encontrar a pasta de status do WhatsApp. Verifique se o WhatsApp está instalado e se você visualizou alguns status recentemente.',
        [{ text: 'OK' }]
      );
      return [];
    }

    // Lê os arquivos do diretório
    const files = await FileSystem.readDirectoryAsync(WHATSAPP_STATUS_PATH);
    
    // Filtra apenas arquivos de imagem e vídeo
    const mediaFiles = files.filter(file => {
      const extension = file.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'mp4', 'gif', 'webp'].includes(extension);
    });

    // Obtém informações detalhadas de cada arquivo
    const statusFiles = await Promise.all(
      mediaFiles.map(async (file) => {
        const fileUri = WHATSAPP_STATUS_PATH + file;
        const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
        const extension = file.toLowerCase().split('.').pop();
        const isVideo = ['mp4'].includes(extension);

        return {
          id: file,
          uri: fileUri,
          filename: file,
          type: isVideo ? 'video' : 'image',
          size: fileInfo.size,
          modificationTime: fileInfo.modificationTime || Date.now(),
          thumbnail: fileUri, // Para imagens, a thumbnail é o próprio arquivo
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

    // Cria um asset na galeria a partir do arquivo
    const asset = await MediaLibrary.createAssetAsync(status.uri);
    
    // Cria um álbum "ReelMate" se não existir e adiciona o asset a ele
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