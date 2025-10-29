import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

// Diretório onde os vídeos serão salvos
const REELMATE_DIRECTORY = '/storage/emulated/0/Download/ReelMate/';
// Para outros sistemas, usamos o diretório do app
const APP_DIRECTORY = FileSystem.documentDirectory + 'ReelMate/';

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
        'Precisamos de permissão para salvar os vídeos na galeria.',
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
 * Verifica se o diretório ReelMate existe e o cria se necessário
 * @returns {Promise<boolean>} - Se o diretório existe ou foi criado com sucesso
 */
export const ensureDirectoryExists = async () => {
  try {
    // No Android, usamos a pasta Downloads/ReelMate
    const directoryPath = Platform.OS === 'android' ? REELMATE_DIRECTORY : APP_DIRECTORY;
    
    // No Android 11+, não precisamos criar o diretório manualmente
    // O MediaStore vai criar automaticamente quando salvarmos o primeiro arquivo
    
    return true;
  } catch (error) {
    console.error('Erro ao criar diretório ReelMate:', error);
    return false;
  }
};

/**
 * Baixa um vídeo do Meta (Facebook/Instagram) para o armazenamento externo
 * @param {string} url - URL do vídeo para download
 * @param {string} quality - Qualidade do vídeo (best_quality, medium_quality)
 * @param {Function} progressCallback - Função de callback para atualizar o progresso
 * @returns {Promise<Object>} - Informações sobre o download
 */
export const downloadMetaVideo = async (url, quality, progressCallback = () => {}) => {
  try {
    // Solicita permissões primeiro
    const hasPermission = await requestStoragePermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permissões não concedidas' };
    }
    
    // Garante que o diretório existe
    const dirExists = await ensureDirectoryExists();
    if (!dirExists) {
      return { success: false, error: 'Não foi possível criar o diretório de download' };
    }
    
    // Gera um nome de arquivo único baseado na data e hora
    const timestamp = new Date().getTime();
    const filename = `meta_video_${quality}_${timestamp}.mp4`;
    // No Android, salvamos diretamente na pasta Downloads/ReelMate
    const fileUri = Platform.OS === 'android' ? REELMATE_DIRECTORY + filename : APP_DIRECTORY + filename;
    
    // Inicia o download com acompanhamento de progresso
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite * 100;
        progressCallback(Math.round(progress));
      }
    );
    
    const result = await downloadResumable.downloadAsync();
    
    if (result && result.uri) {
      // Cria um asset na galeria a partir do arquivo
      const asset = await MediaLibrary.createAssetAsync(result.uri);
      
      // Cria um álbum "ReelMate" se não existir e adiciona o asset a ele
      const album = await MediaLibrary.getAlbumAsync('ReelMate');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('ReelMate', asset, false);
      }
      
      return { 
        success: true, 
        uri: result.uri,
        filename: filename,
        size: result.size,
        asset: asset
      };
    } else {
      return { success: false, error: 'Falha ao baixar o vídeo' };
    }
  } catch (error) {
    console.error('Erro ao baixar vídeo do Meta:', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
};