var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var path = require("path");
var mongoose = require("mongoose");
var sizeOf = require("image-size");
var MD5 = require("MD5");
var cors = require("cors");
var app = express();

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cors());
app.use(multer({
	dest : "./public/img/",
	rename : function (fieldname, filename) {
		return Math.random().toString(36).substr(2, 5);
	}
}));

mongoose.connect("mongodb://localhost:27017/photoo");
var Schema = mongoose.Schema;
var ObjectId = mongoose.ObjectId;

var Image = new Schema({
	uploadedBy : String,
	id : String,
	caption : String,
	width : Number,
	height : Number,
	uploadDate : { type : Date, default : Date.now },
	comments : [{
		commentedBy : String,
		commentBody : String
	}],
	commentsNumber : { type : Number, default : 0 },
	likesNumber : { type : Number, default : 0 },
	likedBy : Array,
	src : String
});
var User = new Schema({
	creationDate : { type : Date, default : Date.now },
	id : { type : String, default : Math.random().toString(36).substr(2, 8) },
	username : String,
	password : String,
	firstName : String,
	lastName : String,
	email : String,
	photos : [{
		id : String,
		caption : String
	}]
});

var ImgModel = mongoose.model("ImgModel", Image);
var UserModel = mongoose.model("UserModel", User);

//////////////////
// GET Requests //
//////////////////
app.get("/", function (req, res) {
	res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/img/:fileName", function (req, res) {
	res.sendFile(path.join(__dirname + "/public/img", req.params.fileName));
});

app.get("/api/photo/:id", function (req, res) {
	if (!req.params.id || req.params.id == undefined || req.params.id == null || req.params.id == "") {
		res.json({
			errror : {
				message : "Please include an ID in the URL.",
				code : 500
			}
		});
		res.status(400);
		res.end();
	} else {
		ImgModel.findOne({ id : req.params.id }, function (err, img) {
			if (img && img != undefined && img != null && img != "") {
				console.log(img);
				res.json(img);
				res.status(200);
				res.end();
			} else {
				res.json({
					errror : {
						message : "Image was not found. Please try another ID.",
						code : 700
					}
				});
				res.end();
			}
		});
	}
});

app.get("/api/login", function (req, res) {
	var username = req.query.username;
	var password = req.query.password;
	if (!username || username == undefined || username == null || username == "") {
		res.json({
			errror : {
				message : "Username is required to log in. Please specify username and try again.",
				code : 400
			}
		});
		res.end();
	} else if (!password || password == undefined || password == null || password == "") {
		res.json({
			errror : {
				message : "Password is required to log in. Please specify username and try again.",
				code : 401
			}
		});
		res.end();
	} else if (username && password && username != undefined && password != undefined && username != null && password != null && username != "" && password != "") {
		UserModel.findOne({ username : username }, function (err, user) {
			if (user && user != undefined && user != null && user != "") {
				if (user.password != MD5(password)) {
					res.json({
						errror : {
							message : "Wrong password. Please change password and try again.",
							code : 402
						}
					});
					res.end();
				} else {
					res.json(user);
					res.end();
				}
			} else {
				res.json({
					errror : {
						message : "Wrong username. Please change username and try again.",
						code : 404
					}
				});
				res.end();
			}
		});
	} else {
		res.json({
			errror : {
				message : "Username and password are required to log in. Please specify them and try again.",
				code : 403
			}
		});
		res.end();
	}
});

app.get("/api/photo/likeDislike/:id", function (req, res) {
	ImgModel.findOne({ id : req.params.id }, function (err, image) {
		var index = image.likedBy.indexOf(req.query.username);
		if (index != -1) {
			image.likedBy.splice(index, 1);
			image.likesNumber--;
			image.save();
			res.json(image);
			res.end();
		} else {
			image.likedBy.push(req.query.username);
			image.likesNumber++;
			image.save();
			res.json(image);
			res.end();
		}
	});
});

app.get("/api/users/find", function (req, res) {
	UserModel.find({ username : req.query.username }, function (err, users) {
		res.json(users);
		res.end();
	});
});

app.get("/api/user/:username/feed", function (req, res) {
	ImgModel.find({ uploadedBy : req.params.username }, function (err, images) {
		res.json(images);
		res.end();
	});
});

////////////////////
// POST Requests ///
////////////////////
app.post("/api/photo/post", function (req, res) {
	console.log(req.files);
	var imgId = req.files.userPhoto.name.split(".")[0];
	var sizeOfImg = sizeOf(req.files.userPhoto.path);
	ImgModel.create({ id : imgId, width : sizeOfImg.width, height : sizeOfImg.height, caption : req.body.caption, uploadedBy : req.body.username, src : "http://192.168.1.15:8080/img/" + imgId + ".png" }, function (err, image) {
		UserModel.findOne({ username : image.uploadedBy }, function (err, user) {
			user.photos.push({
				id : image.id,
				caption : image.caption
			});
			user.save();
			res.json(image);
			res.status(200);
			res.end();
		});
	});
});

app.post("/api/signup", function (req, res) {
	var username = req.body.username;
	var password = MD5(req.body.password);
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var finDetails = {
		username : username,
		password : password,
		firstName : firstName,
		lastName : lastName,
		email : email,
	}
	UserModel.findOne({ username : finDetails.username }, function (err, user) {
		if (!user || user == undefined || user == null) {
			UserModel.create(finDetails, function (err, user) {
				res.json(user);
				res.status(200);
				res.end();
				console.log(user);
			});
		} else {
			res.json({
				error : {
					message : "Username already registered. Please try another one.",
					code : 800
				}
			});
			res.status(400);
			res.end();
		}
	});
});

app.post("/api/photo/comment/:id", function (req, res) {
	ImgModel.findOne({ id : req.params.id }, function (err, image) {
		image.comments.push({
			commentedBy : req.body.username,
			commentBody : req.body.message
		});
		image.commentsNumber++;
		image.save();
		res.json(image);
		res.end();
	});
});

var server = app.listen(process.env.PORT || 5000, function () {
	console.log("Listening on port 8080");
});