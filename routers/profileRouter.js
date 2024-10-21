const express = require('express');
const Router = express();
const Schema = require('../models/Schema');
const userSchema = require('../models/userSchema');
const tokenSchema = require('../models/tokenSchema');
const SchemaDirect = require('../models/SchemaDirect');
const upload = require('../middleware/imgUpload');
const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: "dotmufoiy",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

Router.get('/profile/:id', async (req, res) => {
    try {
        const containOnlyNumber = /^\d+$/.test(req.params.id);

        const user = await userSchema.findOne( 
            containOnlyNumber ? { googleId: req.params.id } : { _id: req.params.id }
        );

        res.status(200).json({ userName: user.name, userAvatar: user.avatar })
        } catch(error) {
            res.status(400).send({ message: `User doesn't exist` });
        }
});

Router.get('/all-profiles', async (req, res) => {
    try {
        const profiles = await userSchema.find();

        const data = profiles.map(profile => {
            return {
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar,
                id: profile.googleId ? profile.googleId : profile._id
            }
        })

        res.status(200).json(data)
        } catch(error) {
            res.status(400).send({ message: `User doesn't exist` });
        }
});

Router.put('/change-settings', upload, async (req, res) => {
    const { id, firstName, lastName, token } = req.body

    const user = await userSchema.findById(id);

    try {
        if(req.file){
            user.avatarId && cloudinary.v2.uploader.destroy(user.avatarId);

            cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
                userSchema.updateOne({ _id: id }, { 
                    name: `${firstName} ${lastName}`,
                    avatar: result.secure_url,
                    avatarId: result.public_id
                }).then(() => {
                    Schema.find({ creator: id}).then(product => {
                        new Promise((resolve) => {
                            for(let x in product){
                              resolve(
                                Schema.updateMany({ creator: product[x].creator }, {
                                  avatar: result.secure_url,
                                  name: `${firstName} ${lastName}`,
                                })
                              );
                            }
                        });
                    });
                })
                .then(() => {
                    userSchema.findOne({ _id: id }).then((result) => {
                        res.json({
                            user: result, 
                            token: token
                        })
                    });
                })

            })
        } else if(req.body.photo?.length > 0) {
            userSchema.updateOne({ _id: id }, { 
                name: `${firstName} ${lastName}`,
            }).then(() => {
                Schema.find({ creator: id}).then(product => {
                    new Promise((resolve) => {
                        for(let x in product){
                          resolve(
                            Schema.updateMany({ creator: product[x].creator }, {
                              name: `${firstName} ${lastName}`,
                            })
                          );
                        }
                    });
                });
            }).then(() => {
                userSchema.findOne({ _id: id }).then((result) => {
                    res.json({
                        user: result, 
                        token: token
                    })
                });
            })
        } else {
            user.avatarId && cloudinary.v2.uploader.destroy(user.avatarId);

            userSchema.updateOne({ _id: id }, { 
                name: `${firstName} ${lastName}`,
                avatar: null,
                avatarId: null
            }).then(() => {
                Schema.find({ creator: id}).then(product => {
                    new Promise((resolve) => {
                        for(let x in product){
                          resolve(
                            Schema.updateMany({ creator: product[x].creator }, {
                              avatar: null,
                              name: `${firstName} ${lastName}`,
                            })
                          );
                        }
                    });
                });
            }).then(() => {
                userSchema.findOne({ _id: id }).then((result) => {
                    res.json({
                        user: result, 
                        token: token
                    })
                });
            })
        }
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
});

Router.post('/delete/:id', async (req, res) => {
    const googleId = /^\d+$/.test(req.body.id);
  
    try{
      if(googleId){
        await Schema.find({ creator: req.body.id}).then(product => {
          new Promise((resolve) => {
            for(let x in product){
              resolve(
                Schema.deleteMany({ creator: product[x].creator })
              );
            }
          });
        });
        await userSchema.deleteOne({googleId: req.body.id});
        res.status(200).json({ message: 'Profile has been successfully deleted' })
      } else {
        const photo = await userSchema.findById(req.params.id);
    
        photo.avatar && cloudinary.v2.uploader.destroy(photo.avatarId);
  
        const token = await tokenSchema.findOne({userId: req.body.id});

        if (!token){
          await Schema.find({ creator: req.body.id}).then(product => {
            new Promise((resolve) => {
              for(let x in product){
                resolve(
                  Schema.deleteMany({ creator: product[x].creator })
                );
              }
            });
          });
          await userSchema.deleteOne({_id: req.body.id});
          res.status(200).json({ message: 'Profile has been successfully deleted' })
        } else {
          await token.deleteOne();
          await Schema.find({ creator: req.body.id}).then(product => {
            new Promise((resolve) => {
              for(let x in product){
                resolve(
                  Schema.deleteMany({ creator: product[x].creator })
                );
              }
            });
          });
          await userSchema.deleteOne({_id: req.body.id});
          res.status(200).json({ message: 'Profile has been successfully deleted' })
        }
      }
    } catch(err){
        res.status(200).json({ message: 'The profile has not been deleted' })
    }
  })

module.exports = Router;
