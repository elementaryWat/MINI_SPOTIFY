const Albums=require("../models/album");
const path=require("path");
const fs=require("fs");

function getAlbum(req,res){
    var albumId=req.params.albumId;
    Albums.findById(albumId).populate({path:"artist"}).exec()
    .then(album=>{
        if(album){
            res.status(200).send({founded:true, album})
        }else{
            res.status(404).send({founded:false, album:null})
        }
    })
    .catch(error=>{
        res.status(500).send({error})
    })
}
function createAlbum(req,res){
    Albums.create(req.body)
    .then(albumCreated=>{
        if(albumCreated){
            res.status(200).send({created:true,album:albumCreated});
        }else{
            res.status(500).send({created:false,message:"No se ha podido crear el album en la base de datos"});
        }
    })
    .catch(error=>{
        res.status(500).send({created:true,error});
    })
}
function getAlbums(req,res){
  var page=(req.params.page)?req.params.page:1;
  var artistId=req.params.artistId;
  var error;
  if (artistId){
      Albums.find({artist:artistId}).sort('year').exec()
      .then(albums=>{
          res.status(200).send({albums});
      })
      .catch(error=>{
          res.status(500).send({error,message:"Ocurrio un error al buscar en la base de datos"});
      })
  }else{
    var albumsPerPage=6;
    message="No hay ningun album";
    Albums.find({}).sort('title').populate({path:'artist'}).paginate(page,albumsPerPage,(err,albums,totalDocs)=>{
        if (err){
            res.status(500).send({err,message:"Ocurrio un error al buscar en la base de datos"})
        }else{
            var numbP=Math.trunc(totalDocs/albumsPerPage);
            numbP=((totalDocs%albumsPerPage)>0)?(numbP+1):numbP;
            if(albums){
                return res.status(200).send({
                    pages:numbP,
                    albums
                })
            }else{
                res.status(404).send({message})
            }
        }
    });
  }
}
function getAlbumsForSearch(req,res){
  //Solo devuelve todos slos albums y en el cliente se implementara la busqueda
  Albums.find().populate({path:'artist'}).exec()
  .then(albums=>{
      res.status(200).send({albums});
  })
  .catch(error=>{
      res.status(500).send({error,message:"Ocurrio un error al buscar en la base de datos"});
  })
}
function updateAlbum(req,res){
    var albumId=req.params.albumId;
    var update=req.body;
    Albums.findByIdAndUpdate(albumId,{$set:update},{new:true})
    .then(albumUpdated=>{
        if (albumUpdated){
            res.status(200).send({updated:true,album:albumUpdated});
        }else{
            res.status(404).send({updated:false,error:"No se ha encontrado el album"});
        }
    })
    .catch(error=>{
        res.status(500).send({updated:false,error});
    })
}
function updateImageAlbum(req,res){
    if (!req.file) {
        console.log("No file received");
        return res.send({
          uploaded: false
        });

      } else {
        console.log('file received',req.file);
        Albums.findByIdAndUpdate(req.params.albumId,{$set:{image:req.file.filename}})
        .then(albumBeforeUpdate=>{
            if(albumBeforeUpdate){
                if(albumBeforeUpdate.image=="default.png"){
                  res.status(200).send({updated:true,image:req.file.filename,albumBeforeUpdate,message:"No se elimino la imagen anterior"});
                }else{
                  var pathOldImage="./uploads/albums/images/"+albumBeforeUpdate.image;
                  fs.exists(pathOldImage,(exists)=>{
                      if(exists){
                          fs.unlink(pathOldImage,(err)=>{
                              if(err){
                                  return res.status(500).send({updated:true,image:req.file.filename,artistBeforeUpdate,message:"No se pudo eliminar la imagen anterior"});
                              }
                              res.status(200).send({updated:true,image:req.file.filename,albumBeforeUpdate,message:"Se elimino la imagen anterior"});
                          })
                      }else{
                          res.status(200).send({updated:true,image:req.file.filename,albumBeforeUpdate,message:"No se encontro la imagen anterior"});
                      }
                  })
                }
            }else{
                res.status(200).send({updated:false});
            }
        })
        .catch(error=>{
            res.status(200).send({updated:false,error});
        })
      }
}
function getImageAlbum(req,res){
    var imageAlbum=req.params.albumImage;
    var dir = "./uploads/albums/images/"+imageAlbum;
    fs.exists(dir,(exists)=>{
        if(exists){
            return res.status(200).sendFile(path.resolve(dir));
        }else{
            return res.status(200).send({founded:false});
        }
    });
}
function deleteAlbum(req,res){
    var albumId=req.params.albumId;
    Albums.findById(albumId).exec()
    .then(album=>{
        if(album){
            album.remove()
            .then(()=>{
              var pathImageRemoved="./uploads/albums/images/"+album.image;

              fs.unlink(pathImageRemoved, (err) => {
                  if (err){
                      return res.status(200).send({deleted:true,fileDeleted:false,error:err})
                  }
                  res.status(200).send({deleted:true,fileDeleted:true,album})
                });
            })
            .catch(error=>{
              res.status(500).send({deleted:false,message:"Ocurrio un error al eliminar el album"});
            })

        }else{
            res.status(404).send({deleted:false,message:"No se ha encontrado el album"});
        }
    })
    .catch(error=>{
        res.status(200).send({deleted:false,error});
    })
}
function deleteAlbumCBDB(albumId){
    Albums.findById(albumId).exec()
    .then(album=>{
        if(album){
            album.remove()
            .then(()=>{
              var pathImageRemoved="./uploads/albums/images/"+album.image;
              fs.unlink(pathImageRemoved, (err) => {
                  if (err){
                      return;
                  }
                  console.log("Se ha eliminado el album correctamente");
                });
            })
            .catch(error=>{
              console.log("Ocurrio un error al eliminar el album");
            })

        }else{
          console.log("No se encontro el album");
        }
    })
    .catch(error=>{
        console.log("Ocurrio un error al buscar el album");
    })
}
module.exports={
    getAlbum,
    createAlbum,
    getAlbums,
    getAlbumsForSearch,
    updateAlbum,
    updateImageAlbum,
    getImageAlbum,
    deleteAlbum,
    deleteAlbumCBDB
}
