const jwt = require('jsonwebtoken');
const userSchema = require('../models/userSchema');

const auth = async (req, res, next) => {
  try {
    const secret = 'test';

    const token = req.headers.authorization.split(" ")[1];
    const isCustomAuth = token.length < 500;

    let decodedData;

    if (token && isCustomAuth) {      
      decodedData = jwt.verify(token, secret);
      req.userId = decodedData?.id;
      await userSchema.findById(req.userId).then((res) => {
        req.verified = res.verified;
      });

    } else {
      decodedData = jwt.decode(token);
      req.userId = decodedData?.sub;
      req.verified = true;
    }    

    next();
  } catch (error) {
    res.status(500).send({ 
      error: 'You have not verified your email'
    });  
  }
};

module.exports = auth;