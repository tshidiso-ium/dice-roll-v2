
// const uploadImage = async (storage, filePath, file) => {
//     try {
//     console.log("uploadImage" );
//     console.log("storage: ", storage );
//     console.log("filePath: ", filePath );
//     console.log("file: ",file);
//       const bucket = storage.getBucketsStream();
//       console.log("bucket: ", bucket);
//       const fileUpload = bucket.file(filePath);
//       await fileUpload.save(file.buffer, {
//         metadata: {
//           contentType: file.mimetype,
//         },
//       });
//       const avatarUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

//       return { avatarUrl };
//     } catch (error) {
//         console.log("storageFunctions uploadImage: Error");
//         console.log(error);
//         throw new Error(error);
//     }   
// };


const uploadImage = async (storage, filePath, file, mimeType) => {
    try {
      const bucket = storage.bucket('amadice-7e4fe.appspot.com');
      const fileUpload = bucket.file(filePath);
      await fileUpload.save(file, {
        metadata: {
          contentType: mimeType,
        },
        public: true,
      });
      
      const avatarUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      return { avatarUrl };
    } catch (error) {
      // console.log("storageFunctions uploadImage: Error");
      // console.log(error);
      throw new Error(error);
    }   
};

const deleteImage = async (storage, filePath) => {
  try {
    if (!filePath) throw new Error('filePath is required');

    const bucket = storage.bucket('amadice-7e4fe.appspot.com');

    // If path ends with '/', treat it as a folder prefix and delete all files under it
    if (filePath.endsWith('/')) {
      await bucket.deleteFiles({ prefix: filePath });
      return { success: true, filePath, deleted: 'folder' };
    }

    // If path doesn't end with '/', check if it's a folder prefix (files exist under filePath/)
    const folderPrefix = `${filePath}/`;
    const [files] = await bucket.getFiles({ prefix: folderPrefix, maxResults: 1 });
    if (files && files.length > 0) {
      await bucket.deleteFiles({ prefix: folderPrefix });
      return { success: true, filePath: folderPrefix, deleted: 'folder' };
    }

    // Otherwise delete a single file
    const fileToDelete = bucket.file(filePath);
    await fileToDelete.delete();
    return { success: true, filePath, deleted: 'file' };
  } catch (error) {
    console.log("storageFunctions deleteImage: Error");
    console.log(error);
    // For deletions, Google Cloud may return a 404 when deleting non-existent files
    if (error && (error.code === 404 || error.code === '404')) {
      return { success: false, message: 'File or folder not found', filePath };
    }
    throw new Error(error);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};