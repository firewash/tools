const sizeOf = require('image-size');
const tool = {
    size(imagePath) {
        return Promise.resolve().then(() =>
            new Promise((resolve, reject) => {
                sizeOf(imagePath, (err, dimensions) => {
                    if (err) {
                        // console.log('~~~~~', err);
                        reject(err);
                    } else {
                        // console.log('~~~~~', dimensions.width, dimensions.height);
                        resolve({
                            width: dimensions.width,
                            height: dimensions.height
                        });
                    }
                });
            })
       );
    }
};

module.exports = tool;
