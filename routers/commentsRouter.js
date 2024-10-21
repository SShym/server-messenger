const express = require('express');
const Router = express();
const auth = require('../middleware/auth');
const upload = require('../middleware/imgUpload');
const Schema = require('../models/Schema');
const SchemaDirect = require('../models/SchemaDirect');
const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: "dotmufoiy",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

Router.post('/comments', upload, auth, async (req, res) => {
    if(req.verified){
        try {
            if(req.file){
                cloudinary.v2.uploader.upload(req.file.path, (err, result) => {  
                    if (err) res.json(err.message);  
            
                    Schema.create({ 
                        ...req.body, 
                        creator: req.userId, 
                        photo: result.secure_url,
                        photoId: result.public_id,
                        photoSize: {
                            width: req.body.photoSize.width,
                            height: req.body.photoSize.height
                        },
                        createdAt: new Date().toISOString(),
                    }).then(createdProduct => {
                        res.json(createdProduct);
                    })
                });
            } else {
                Schema.create({ 
                    ...req.body, 
                    creator: req.userId,
                    createdAt: new Date().toISOString(),
                }).then(createdProduct => res.json(createdProduct))
            }
        } catch(error){
            res.status(400).send({ error: 'Error while uploading file try again later' });
        }
    } else {
        res.status(500).send({ error: 'You have not verified your email' });  
    }
});

Router.post('/delete-direct-chat/:room', async (req, res) => {
    try{
        await SchemaDirect.find({ to: req.params.room }).then(comment => {
            new Promise((resolve) => {
                for(let x in comment){
                    comment[x].photoId && cloudinary.v2.uploader.destroy(comment[x].photoId),
                    resolve(SchemaDirect.deleteMany({ to: comment[x].to }));
                }
            });
        });

        res.status(200).json({ message: 'Success' }); 
    } catch(err) {
        res.status(500).send({ error: 'Something went wrong' }); 
    }
})

Router.post('/commentsDirect/:room', upload, auth, async (req, res) => {
    const { comment, changed, timeCreate, name, avatar } = req.body;

    if(req.verified){
        try {
            if(req.file){
                cloudinary.v2.uploader.upload(req.file.path, (err, result) => {  
                    if (err) res.json(err.message);  
                    
                    SchemaDirect.create({
                        creator: req.userId, 
                        photo: result.secure_url,
                        photoId: result.public_id,
                        avatar: avatar,
                        comment: comment,
                        timeCreate: timeCreate,
                        changed: changed,
                        name: name,
                        to: req.params.room,
                        photoSize: {
                            width: req.body.photoSize.width,
                            height: req.body.photoSize.height
                        },
                    }).then(createdProduct => {
                        res.json(createdProduct);
                    })
                });
            } else {
                SchemaDirect.create({ 
                    creator: req.userId, 
                    comment: comment,
                    timeCreate: timeCreate,
                    changed: changed,
                    avatar: avatar,
                    name: name,
                    to: req.params.room
                }).then(createdProduct => {
                    res.json(createdProduct);
                })
            }
        } catch(error){
            res.status(400).send({ error: 'Error while uploading file try again later' });
        }
    } else {
        res.status(500).send({ error: 'You have not verified your email' });  
    }
});

Router.put('/comments/:id', upload, auth, async (req, res) => { 
    const photo = await Schema.findById(req.params.id);

    if(req.verified){
        try {
            if(req.file){
                photo.photoId && cloudinary.v2.uploader.destroy(photo.photoId);

                cloudinary.v2.uploader.upload(req.file.path, (err, result) => {  
                    if (err) res.json(err.message);  
            
                    Schema.updateOne({_id: req.params.id}, {
                        ...req.body,
                        photo: result.secure_url,
                        photoId: result.public_id,
                    }).then(() => {
                        Schema.findById(req.params.id).then((result) => res.json(result))
                    }).catch(err => res.status(500).json(err))
                });
            } else {
                req.body.photo?.length === 0 && cloudinary.v2.uploader.destroy(photo.photoId);

                await Schema.updateOne({_id: req.params.id}, req.body).then(() => {
                    Schema.findById(req.params.id).then((result) => res.json(result))
                })
            }
        } catch(error){
            res.status(400).send({ error: 'Error while uploading file try again later' });
        }
    } else {
        res.status(500).send({ error: 'You have not verified your email' });  
    }
});

Router.delete('/comments/:id', auth, async (req, res) => {
    const photo = await Schema.findById(req.params.id);

    if(req.verified){
        Schema.deleteOne({_id: req.params.id})
        .exec().then(() => {
            photo.photoId && cloudinary.v2.uploader.destroy(photo.photoId)
            res.json({ success: true });
        })
        .catch(err => res.status(500).json(err))
    } else {
        res.status(500).send({ error: 'You have not verified your email' });  
    }
});

module.exports = Router;
