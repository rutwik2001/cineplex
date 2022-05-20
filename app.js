//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const bcrypt = require("bcrypt");
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const flash = require("express-flash")
const session = require("express-session")
var crypto = require("crypto");
var moment = require('moment'); // require
moment().format();

const { uploadFile, getFileStream } = require('./s3')

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use("/public", express.static('public'))




 


mongoose.connect("mongodb+srv://admin:AK3pYiEhuJ6VuPoT@cluster0.ulxnq.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true});

const db = mongoose.connection
db.on("error", console.error.bind(console, "Not Connected"))
db.once("open", () => {
  console.log("Mongoose connection established...")
})






const songSchema = {
    numId: { type: Number, default: 0 },
    name: String,
    location: {
      type: String,
      unique: true
  }
}

const Song = mongoose.model("Song", songSchema);





// const postSchema = {
//   title: String,
//   content: String
// };



// app.get("/", function(req, res){

//   Post.find({}, function(err, posts){
//     res.render("home", {
//       startingContent: homeStartingContent,
//       posts: posts
//       });
//   });
// });




app.get("/", function(req, res){
  
  Song.find({}, function(err, songs){
    res.render("home", {
      songs: songs,
      });
    
  });
  
});


app.get("/newVideo", function(req, res){
  
  
  res.render("newSong",{
  });
});



app.post("/newVideo",upload.single('target_file'), async function(req, res){
  try{
  

  let file = req.file;
  //console.log(file);

  const result = await uploadFile(file)
  await unlinkFile(file.path)
  //console.log(result)
  

  const location = result.Key //AWS S3
  const countOfSongs = await Song.find({});
  const song = new Song({
    numId: countOfSongs.length + 1,
    name: req.body.name,
    location: location
  });

  await song.save();
  // Album.songs.push(countOfSongs.length)
  // Album.updateOne({numId: albumId}, {$push: {
  //   songs: countOfSongs.length
  // }})
  
  res.redirect(`/videos/${countOfSongs.length + 1}`)
  } catch(err){
    console.log(err.message)
  }

  
});

app.get("/videos/:songId", async function(req, res){
  
  const songId = req.params.songId
  try {
    
    await Song.findOne({numId: songId}, function(err, song){
    res.render("song", {
      song: song,
      });
  });
  } catch(err){
    console.log(err.message)
  }
});

app.get('/song/:key', (req, res) => {
  const key = req.params.key
  const readStream = getFileStream(key)

  readStream.pipe(res)
})


app.get("/search", (req, res) => {
  
  res.render("search", {
    songs: [],
  });
  
})

app.post("/search", async (req, res) => {
  const query = req.body.query;
  try {
    
    await Song.find({"name" : {$regex : query }}, function(err, songs){
      
    res.render("search", {
    songs: songs
  });
  });
  } catch(err){
    console.log(err.message)
  }
})







const port = process.env.PORT || 3000
app.listen(port, function() {
  console.log("Server started on port 3000");
});