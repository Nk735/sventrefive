const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const axios = require('axios');
const port = 3000;
//const bcrypt = require('bcrypt');
//const socketIO = require('socket.io');
//const io = socketIO(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'))

// Connect to MongoDB

main().catch((err) => console.log(err));
async function main() {
  mongoose.connect('mongodb://user:user@localhost:27017/social_network', { useNewUrlParser: true, useUnifiedTopology: true});
}


//LOGIN WIDTH SPOTIFY

const clientId = '654a81499ad1490bb441474e57f0454c';
const clientSecret = '455a443a8506414fa19eb0fd0d929a6f';
const redirectUri = 'http://localhost:3000/callback';

app.get('/login', (req, res) => {
  // Reindirizza l'utente a Spotify per l'autenticazione
  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=user-read-private%20user-read-email`;
  res.redirect(spotifyAuthUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  // Scambia il codice di autorizzazione con il token di accesso
  const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
    params: {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    },
  });

  const accessToken = tokenResponse.data.access_token;
  // Ora puoi utilizzare accessToken per effettuare richieste alle API di Spotify a nome dell'utente autenticato
  // Ad esempio:
   const userInfoResponse = await axios.get('https://api.spotify.com/v1/me', {
     headers: {
       'Authorization': `Bearer ${accessToken}`,
     },
  });

  // Restituisci una risposta o effettua altre azioni qui
  res.redirect("../chat.html");
  
  //function verificaAutenticazione(req, res, next) {
   // if (req.session && req.session.user) {
   //   return next(); // L'utente è autenticato, passa alla pagina riservata
   // } else {
   //   res.redirect('../localhost:3000'); // L'utente non è autenticato, reindirizza alla pagina di login
   // }
  //}
  
  //Applica il middleware alle pagine riservate
  //app.get('../home.html', verificaAutenticazione, (req, res) => {
  //  res.redirect("../home.html");
  //});
});
//LOGIN COMPLETATO

// Schema utenti
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  token_spotify: String,
});

const User = mongoose.model('User', userSchema);

// Set up a simple route to handle creating a new user
app.post('/user', (req, res) => {
  let newUser = new User({
    email: req.body.email,
    password: req.body.password
  });
/*
  //crittografia password
  let plainPassword = newUser.password;
  const saltRounds = 10; // Il numero di volte che il salt viene generato (maggiore è più sicuro, ma più lento)

  bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Errore durante la crittografia della password', err);
    } else {
        // Ora puoi memorizzare 'hash' nel tuo database insieme a un eventuale 'salt'
        console.log('Password crittografata:', hash);
        newUser.password = hash;
    }
  })*/
  newUser.save().then((document) => {
    if (document) {
      console.error(document);
      res.status(200).send('Created user con contenuto:' + document.email);
    } else {
      res.status(500).send('Errore');
    }
  });
});


//Codice per il login senza password criptata

app.post('/login_normal', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password }).exec();
    if (user) {
        req.session.user = user;
        res.json("success");
    } else {
        res.status(401).json("failure");
    }
  } catch (err) {
      console.error(err);
      res.status(500).json("server error");
  }
});


//your top 5 tracks from the last 30 days
const token= 'BQAoUWdwhVJ1SeeX43kGj0dAebm2KKBwnwruPIXTgXnRYpz0qMqhQ8TZlwz-ozm3kTNMDyQ1Q1JpnpkS8ifEM5b2iQZ9Sm4dNFnLIZAuKJLMnk33RzYDnfeZ4NO_FEdGprZW6R7AWXFQH6Cni-yU-Sdc2N3LAqb2aMOitkTrZfB-QqIzFwKV6J9s_i7uw4XxkSM1SYfgqHyYnllMEn4XH_-b-bZMzw3ossMSkmWuSDWF4d5IWfzLAN0REI0vQB7gYddBuOH9lr0GCxYMfO_d';

async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=short_term&limit=10', 'GET'
  )).items;
}

async function ToppTracks() {
  try {
    const topTracks = await getTopTracks();
    console.log(
      topTracks?.map(
        ({ name, artists }) =>
          `${name} by ${artists.map((artist) => artist.name).join(', ')}`
      )
    );
    // Ottieni il riferimento all'elemento HTML
    const topTracksContainer = document.getElementById('topTracksContainer');

    // Crea un nuovo elemento per ogni traccia e artista e aggiungilo all'elemento HTML
    tracksInfo.forEach((track) => {
      const trackElement = document.createElement('p');
      trackElement.textContent = track;
      topTracksContainer.appendChild(trackElement);
    });
  } catch (error) {
    console.error('Errore durante il recupero delle top tracks:', error);
  }
}
// Chiamata alla funzione principale
ToppTracks();
const UserTrack = new mongoose.Schema({
  tracks: String,
});

const Tracks = mongoose.model('Tracks', UserTrack);






// Define a basic schema for a post
const postSchema = new mongoose.Schema({
  content: String
});

const Post = mongoose.model('Post', postSchema);

// Set up a simple route to handle creating a new post
app.post('/post', (req, res) => {
  const postContent = req.body.content;
  const newPost = new Post({
    content: postContent
  });

  newPost.save().then((document) => {
    if (document) {
      console.error(document);
      res.status(200).send('Created post con contenuto:' + document.content);
    } else {
      res.status(500).send('Errore');
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});



//Messaggi
/*

const Message = require('./Message');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for incoming chat messages
  socket.on('chat message', (data) => {
    console.log('Received message:', data);

    // Save the message to MongoDB
    const message = new Message({ user: data.user, text: data.message });
    message.save((err) => {
      if (err) {
        console.error('Error saving message to database:', err);
      } else {
        console.log('Message saved to the database');
      }
    });

    // Broadcast the message to all connected clients
    io.emit('chat message', data);
  });

  // Listen for user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(express.static('public'));

*/
