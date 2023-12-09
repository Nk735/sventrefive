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
  console.log("connecting")
  mongoose.connect('mongodb://user:user@localhost:27017/social_network', { useNewUrlParser: true, useUnifiedTopology: true});
  console.log("connected")
}
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});

//LOGIN WIDTH SPOTIFY

const clientId = '654a81499ad1490bb441474e57f0454c';
const clientSecret = '455a443a8506414fa19eb0fd0d929a6f';
const redirectUri = 'http://localhost:3000/callback';

// TABELLONI
// Schema utenti
const userSchema = new mongoose.Schema({
  id: Number,
  email: String,
  password: String,
  nome: String,
  image: String,
  token_spotify: String,
});
const User = mongoose.model('User', userSchema);



// CHIAMATONE
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
  })

  const accessToken = tokenResponse.data.access_token;
  // Ora puoi utilizzare accessToken per effettuare richieste alle API di Spotify a nome dell'utente autenticato
  // Ad esempio:
  const userInfoResponse = await axios.get('https://api.spotify.com/v1/me', {
     headers: {
       'Authorization': `Bearer ${accessToken}`,
     },
  }).then((res_axios)=>{

    //LOGIN COMPLETATO
    User.create({
      nome: res_axios.data.display_name,
      token_spotify: accessToken
    }).then((res_mongo)=>{
      console.log(res_mongo)
      res.status(200).send(res_mongo.ObjectId)
    }).catch(err => {
      res.status(500)
    })

  }).catch((err)=>{
    res.status(400)
  });


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
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: 'Bearer ${accessToken}',
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
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
    /*
    // Ottieni il riferimento all'elemento HTML
    const topTracksContainer = document.getElementById('topTracksContainer');

    // Crea un nuovo elemento per ogni traccia e artista e aggiungilo all'elemento HTML
    tracksInfo.forEach((track) => {
      const trackElement = document.createElement('p');
      trackElement.textContent = track;
      topTracksContainer.appendChild(trackElement);
    });*/
  } catch (error) {
    console.error('Errore durante il recupero delle top tracks:', error);
  }
}
// Chiamata alla funzione principale
ToppTracks();

const branoSchema = new mongoose.Schema({
  titolo: String,
  durata: String
});
const Brano = mongoose.model('Brano', branoSchema);

const artistaSchema = new mongoose.Schema({
  nome_artista: String,
  genere: String
});
const Artista = mongoose.model('Artista', artistaSchema);

const SPOTIFY_API_URL = 'https://api.spotify.com/v1/';
app.get('/ottieni-artisti', async (req, res) => {
  try {
    const token = 'IL_TUO_TOKEN_DI_AUTORIZZAZIONE_DA_SPOTIFY'; // Assicurati di avere il token valido qui

    const response = await axios.get(`${SPOTIFY_API_URL}browse/new-releases`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Esempio di elaborazione della risposta e salvataggio su MongoDB
    const artistiDaSalvare = response.data.artisti.map((artista) => ({
      nome: artista.name,
      id_spotify: artista.id,
      genere: artista.genere
    }));

    await Artista.insertMany(artistiDaSalvare);

    res.status(200).json({ message: 'Artisti ottenuti e salvati su MongoDB!' });
  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Si è verificato un errore durante l\'ottenimento degli artisti.' });
  }
});


const branoArtistaSchema = new mongoose.Schema({
  ID_brano: { type: mongoose.Schema.Types.ObjectId, ref: Brano },
  ID_artista: { type: mongoose.Schema.Types.ObjectId, ref: Artista }
});
const BranoArtista = mongoose.model('BranoArtista', branoArtistaSchema);

const preferenzeUtentiArtistaSchema = new mongoose.Schema({
  ID_utente: { type: mongoose.Schema.Types.ObjectId, ref: User },
  ID_artista: { type: mongoose.Schema.Types.ObjectId, ref: Artista }
});
const PreferenzeUtentiArtista = mongoose.model('PreferenzeUtentiArtista', preferenzeUtentiArtistaSchema);

const preferenzeUtentiBranoSchema = new mongoose.Schema({
  ID_utente: { type: mongoose.Schema.Types.ObjectId, ref: User },
  ID_brano: { type: mongoose.Schema.Types.ObjectId, ref: BranoArtista }
});
const PreferenzeUtentiBrano = mongoose.model('PreferenzeUtentiBrano', preferenzeUtentiBranoSchema);

const ConcertoSchema = new mongoose.Schema({
  ID_artista: { type: mongoose.Schema.Types.ObjectId, ref: 'Artista' },
  Data_concerto: { type: Date, required: false  },
  Luogo: { type: String, required: false }
});
const Concerto = mongoose.model('Concerto', ConcertoSchema);

// Rotta per ottenere gli eventi dei concerti di un artista da Spotify e salvarli nel database
app.get('/artist/:id/concerts', async (req, res) => {
  try {
      const artistId = req.params.id; // ID dell'artista da Spotify

      // Esempio di utilizzo dell'endpoint delle Spotify API per ottenere gli eventi di un artista
      const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/events`, {
          headers: {
              Authorization: `Bearer ${accessToken}`
          }
      });

      const events = response.data; // Dati degli eventi ottenuti da Spotify API

      // Salva ogni evento nel database
      for (const event of events) {
          const nuovoConcerto = new Concerto({
              ID_artista: artistId,
              Data_concerto: new Date(event.date), 
              Luogo: event.place.name
          });

          await nuovoConcerto.save();
      }

      res.json({ message: 'Eventi dei concerti salvati nel database!' });
  } catch (error) {
      console.error('Errore durante il recupero degli eventi dei concerti:', error);
      res.status(500).json({ error: 'Errore durante il recupero degli eventi dei concerti' });
  }
});


/*
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


*/


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
