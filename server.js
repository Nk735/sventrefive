const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const axios = require('axios');
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'))

// Connect to MongoDB

main().catch((err) => console.log(err));
async function main() {
  mongoose.connect('mongodb://user:user@localhost:27017/social_network', { useNewUrlParser: true, useUnifiedTopology: true});
}



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
  res.send('Autenticazione completata!');




  
});

/*
app.get('/get_artisti', (req, res) => {
  const getArtistsButton = document.getElementById('getArtistsButton');
  const artistsList = document.getElementById('artistsList');

  getArtistsButton.addEventListener('click', () => {
    // Effettua una richiesta alle API di Spotify per ottenere gli artisti seguiti
    axios.get('https://api.spotify.com/v1/me/following?type=artist', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then(response => {
        const followedArtists = response.data.artists.items;
        const artistNames = followedArtists.map(artist => artist.name);
        artistsList.innerHTML = 'Artisti seguiti su Spotify: ' + artistNames.join(', ');
      })
      .catch(error => {
        console.error('Errore durante il recupero degli artisti seguiti:', error);
        artistsList.innerHTML = 'Si è verificato un errore durante la richiesta.';
      });
  });
});
*/

// Definizione dello schema per la collezione utenti


// Define a basic schema for a post
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  token_spotify: String,
});

const User = mongoose.model('User', userSchema);

// Set up a simple route to handle creating a new post
app.post('/user', (req, res) => {
  const newUser = new User({
    email: req.body.email,
    password: req.body.password
  });

  newUser.save().then((document) => {
    if (document) {
      console.error(document);
      res.status(200).send('Created user con contenuto:' + document.email);
    } else {
      res.status(500).send('Errore');
    }
  });
});

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

