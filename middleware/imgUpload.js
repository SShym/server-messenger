const multer = require('multer');

const storage = multer.diskStorage({
    filename: function(req, file, callback) {
      callback(null, Date.now() + file.fieldname);
    }
  });
  
const upload = multer({ storage: storage });
  
module.exports = upload.single('photo');