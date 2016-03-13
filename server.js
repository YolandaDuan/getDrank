var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var serverSocket = require('socket.io')(server);

var cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session); 

console.log(session);

var mongo = require('mongodb');
var mongoClient = require('mongodb').MongoClient;
var mongoUrl = 'mongodb://heroku_66dvhhlx:7jao0b6kacr0ti5okbmvgqsdmu@ds055905.mongolab.com:55905/heroku_66dvhhlx';
var recipesCollection;
var ingredientsCollection;
var userCollection;

mongoClient.connect(mongoUrl, function(err, db) {
	if(!err) { 
		console.log("Connected to database...");
		recipesCollection = db.collection('recipes');
		ingredientsCollection = db.collection('ingredients');
		userCollection = db.collection('users');
	};
});
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'foo',
    store: new MongoStore({url: mongoUrl}),
    resave: false,
  	saveUninitialized: true
}));

app.use(express.static(__dirname + '/client'));

//router is used for flow control
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

//login route
app.get('/login', function(req, res){
	res.sendFile(__dirname + '/client/login.html')
});

app.get('/logout', function(req,res){
	req.session.destroy();
	res.redirect('/');
});

app.get('/createAccount', function(req,res){
	res.sendFile(__dirname + '/client/createAccount.html');
});

app.get('/profile', function(req, res){
	res.sendFile(__dirname + '/client/profile.html');	
});

app.get('/api/loggedIn', function(req,res){
	console.log("TEST");
	if(req.session.user){
		res.send({loggedIn: 'true'});
	}
	else{
		res.send({loggedIn: 'false'});
	}
})

//TODO: Insert comment for logged in user
app.post('/comment', function(req,res){
	if(req.session.user){
		var username = req.session.user.userName;
		commentObj = req.body;
		recipeCollection.findOne({_id: commentObj.recipeId}, function(err, recipe){
			if(recipe){
				recipeCollection.update({ _id: commentObj.recipeId }, {comments: recipe.comments.push(commentObj.comment)}, {upsert: true});
				res.sendStatus(200);
			}
			else{
				res.send(err);
			}
		});
	}
	else{
		res.sendStatus(304) //Not Modified
	}

});

//req.session.destroy();
app.post('/login', function(req, res){
	var user = req.body;
	console.log("THE USER:");
	console.log(user);
	userCollection.findOne({'userName': user.username}, function(err, db_user){
		console.log(db_user);
		if(!db_user){
			console.log("No User")
			res.redirect('/login?status=unknownUser');
		}
		if(user.password === db_user.password){
			console.log("Password matched");
			req.session.user = db_user;
			res.redirect('/profile');

		}
		else{
			console.log("Password did not match");
			res.redirect('/login?status=wrongPassword')
		}
	});
});

app.post('/createAccount', function(req, res){
	var user = req.body;
	console.log(user);
		if(!user){
			console.log("No User");
			
		}
		else{
			userCollection.insert(user);
			res.send({redirect: '/login'});
		}

});



app.get('/api/req_all_database', function(req, res){
	//get all records from the database
	//send the record back by typing res.send(result)
	//Instead of using sockets you can use Ajax to send a get request here
	//and get the json back.
});

app.get('/api/userInfo', function(req, res){
	console.log(req.session.user);
	res.send(req.session.user);
});



server.listen(process.env.PORT || 5000);

serverSocket.on('connection', function(clientConSock){		
	console.log("A client connected");


	// Client connected, show all database documents.
	clientConSock.on('req_all_database', function() {		
		var cursor = recipesCollection.find();				
		cursor.each(function(err, doc) {					
			if(err) {
			} else {
				if(doc != null) {													
					clientConSock.emit('res_all_database', JSON.stringify(doc));	
				}																	
			}
		});
	});

	// Client input a name of a drink, insert into database
	clientConSock.on('insert_database', function(data) {	
		recipesCollection.insert(data);
		clientConSock.emit('insert_succesful');				
	});

	//  Client create a user account, insert into database  
	clientConSock.on('insert_user_database', function(user) {
		userCollection.insert(user);
		clientConSock.emit('insert_user_succesful');				
	});

	

	//  TODO: login
	clientConSock.on('login', function(user) {
		
		console.log(user);

		var cursor = userCollection.find({'userName': user.userName});
		cursor.each(function(err, doc) {
			if(err) {
				console.log(err);
			} else {
				if(doc != null) {
					console.log("doc is not null");
					if (doc.password === user.password)
					{ 
						console.log("Login succesful");
						
						clientConSock.emit('login_successful');
					}
					else {
						
						clientConSock.emit('login_failed');
						console.log("Login failed");
						console.log("Inserted password: "+user.password);
						console.log("Correct password: "+doc.password);
					}
				}
			}
		});
			
	});



	// Client input a string, fetch from database and return. Search function.
	clientConSock.on('search_database', function(data) {
		data = JSON.parse(data);
		var ingQuery = true;
		for (var i = 0; i < data.length; i++) {
			if (data[i][0] == true) {
				// A drinkname has been found, do the first drinkname.
				ingQuery = false;
				var cursor = recipesCollection.find({'name': data[i][1]});
				cursor.each(function(err, doc) {
					if(err) {
						console.log(err);
					} else {
						if(doc != null) {
							clientConSock.emit('search_succesful', JSON.stringify(doc));
						}
					}
				});
				i = data.length;
			}
		}

		// No drinknames in query, only ingredients

		if (ingQuery) {
			var cursor2;
			if (data.length == 0) {
				cursor2 = recipesCollection.find();
			} else if(data.length == 1) {
				cursor2 = recipesCollection.find( {
					ingredients: { $all: [
						{ "$elemMatch" : { name: data[0][1] } }
						] }
					} );
			} else if(data.length == 2) {
				cursor2 = recipesCollection.find( {
					ingredients: { $all: [
						{ "$elemMatch" : { name: data[0][1] } },
						{ "$elemMatch" : { name : data[1][1] } }
						] }
					} );
			} else if(data.length == 3) {
				cursor2 = recipesCollection.find( {
					ingredients: { $all: [
						{ "$elemMatch" : { name: data[0][1] } },
						{ "$elemMatch" : { name : data[1][1] } },
						{ "$elemMatch" : { name : data[2][1] } }
						] }
					} );
			} else {
				cursor2 = recipesCollection.find( {
					ingredients: { $all: [
						{ "$elemMatch" : { name : data[0][1] } },
						{ "$elemMatch" : { name : data[1][1] } },
						{ "$elemMatch" : { name : data[2][1] } },
						{ "$elemMatch" : { name : data[3][1] } }
						] }
					} );
			}
			cursor2.each(function(err, doc) {
				if(err) {
					console.log(err);
				} else {
					if(doc != null) {
						clientConSock.emit('search_succesful', JSON.stringify(doc));
					}
				}
			});
		}
	});

	// Client likes a drink

	clientConSock.on('drink_like', function(drinkId) {

		// IMPLEMENT A CHECK IF THE ONE CLICKING THE DRINK IS LOGGED IN AS A USER:
		var isUser = true;

		// TODO: check the user's identification
		if (isUser) {
			var o_id = new mongo.ObjectID(drinkId);
			recipesCollection.update({"_id": o_id}, {$inc : { like: 1} });
			clientConSock.emit('like_succeded', drinkId);
		} else {
			alert("please log in or create an account!");
		}
	});


	// Client comment on a drink

	clientConSock.on('drink_comment', function(comment, drinkId) {
		var comment = JSON.parse(comment);
		if(comment.userName) {
			var o_id = new mongo.ObjectID(drinkId);
			recipesCollection.update({"_id": o_id}, { $push: { "comments": comment } });
			clientConSock.emit('comment_succeded', JSON.stringify(comment), drinkId);
		}
	});



	// Client wants to retrieve all the ingredients for the token array
	clientConSock.on('req_all_ingredients', function() {
		var cursor = [ingredientsCollection.find(), recipesCollection.find()];
		for (var i = 0; i < cursor.length; i++) {
			cursor[i].each(function(err, doc) {
				if(err) {
					console.log(err);
				} else {
					if(doc != null) {
						clientConSock.emit('res_all_ingredients', JSON.stringify(doc));
					}
				}
			});
		}
	});
});




console.log("server is running...");