import { createClient } from '@supabase/supabase-js';
import { UploadFileType } from '../components/BaseRichTextInput';
import Config from 'react-native-config';

console.log({ Config });

export const supabase = createClient(
  'https://rjbbkvlkddjpuujuicdn.supabase.co',
  'sb_publishable__6x-7-hJLFEYCrxQZUyxxg_WQv5WDMj',
);

export const IMAGE_BASE_URL =
  'https://rjbbkvlkddjpuujuicdn.supabase.co/storage/v1/object/public/';

export const uploadFilesToSupabase = async (
  fileList: UploadFileType[],
): Promise<string[]> => {
  console.log({ fileList });

  const { data, error: uploadError } = await supabase.storage
    .from('files')
    .upload(fileList[0].path, fileList[0].arrayBuffer, {
      contentType: fileList[0].type ?? '',
    });
  console.log({ uploadError });

  if (uploadError) {
    throw uploadError;
  }

  console.log({ data });
  // actual path : https://rjbbkvlkddjpuujuicdn.supabase.co/storage/v1/object/public/files/1768475003693.jpg
  // path : 1768475003693.jpg
  // full path ; files/1768475003693.jpg
  const path = IMAGE_BASE_URL + data.fullPath;
  return [path];
};
