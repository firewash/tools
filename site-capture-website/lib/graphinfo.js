const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const tool = {
    size(imagePath) {
        return Promise.resolve().then(() => {
            return new Promise((resolve, reject) => {
                gm(imagePath).size((err, value) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(value);
                    }
                });
            });
        });
    }
};

module.exports = tool;
