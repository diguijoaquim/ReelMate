import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

const APP_CACHE_DIRECTORY = FileSystem.cacheDirectory;

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
 * Lista vídeos baixados no álbum "ReelMate" da galeria
 * @returns {Promise<Array>} - Lista de itens com metadados dos vídeos
 */
export const listDownloadedVideos = async () => {
  try {
    const hasPermission = await requestStoragePermissions();
    if (!hasPermission) return [];

    const album = await MediaLibrary.getAlbumAsync('ReelMate');
    if (!album) return [];

    const page = await MediaLibrary.getAssetsAsync({
      album,
      mediaType: [MediaLibrary.MediaType.video],
      first: 2000,
      sortBy: MediaLibrary.SortBy.creationTime,
    });

    const assets = (page?.assets || []).sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));

    const items = await Promise.all(
      assets.map(async (asset) => {
        let uri = asset.uri;
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset);
          uri = info?.localUri || asset.uri;
        } catch {}
        let sizeText = undefined;
        try {
          const stat = await FileSystem.getInfoAsync(uri);
          if (stat?.size) {
            const mb = stat.size / (1024 * 1024);
            sizeText = `${mb.toFixed(1)} MB`;
          }
        } catch {}
        return {
          id: asset.id,
          title: asset.filename || 'Video',
          url: uri,
          platform: 'local',
          downloadDate: new Date(asset.creationTime || Date.now()).toISOString(),
          status: 'completed',
          quality: 'unknown',
          fileSize: sizeText,
        };
      })
    );

    return items;
  } catch (error) {
    console.error('Erro ao listar vídeos baixados:', error);
    return [];
  }
};

/**
 * Verifica se o diretório ReelMate existe e o cria se necessário
 * @returns {Promise<boolean>} - Se o diretório existe ou foi criado com sucesso
 */
export const ensureDirectoryExists = async () => {
  try {
    const directoryPath = APP_CACHE_DIRECTORY;
    await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true }).catch(() => {});
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
    const fileUri = `${APP_CACHE_DIRECTORY}${filename}`;
    
    // Inicia o download com acompanhamento de progresso
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const total = downloadProgress.totalBytesExpectedToWrite || 0;
        const written = downloadProgress.totalBytesWritten || 0;
        const progress = total > 0 ? (written / total) * 100 : 0;
        progressCallback(Math.round(progress));
      }
    );
    
    const result = await downloadResumable.downloadAsync();
    
    if (result && result.uri) {
      const asset = await MediaLibrary.createAssetAsync(result.uri);
      
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