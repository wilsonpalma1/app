const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app); // Crear servidor HTTP con Express
const io = socketIo(server); // Inicializar Socket.IO con el servidor HTTP

// Conexión a la base de datos MongoDB
const mongoURI = 'mongodb+srv://wilson:seSuponeQueNadieDeberíaVerEsto@cluster0.hlmwucg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB Atlas:'));
db.once('open', () => {
  console.log('Conectado a la base de datos MongoDB Atlas');
});

// Ruta de inicio
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Definir un modelo de mensaje
const messageSchema = new mongoose.Schema({
  username: String,
  text: String
});
const Message = mongoose.model('Message', messageSchema);

//Socket.io
io.on('connection', async (socket) => {
  console.log('Usuario conectado');

  try {
    // Cargar mensajes al conectar
    const messages = await Message.find({});
    socket.emit('load messages', messages);
  } catch (error) {
    console.error('Error al cargar los mensajes:', error);
  }

  socket.on('chat message', async (data) => {
    console.log(`Mensaje recibido de ${data.username}: ${data.message}`);

    // Guardar el mensaje en la base de datos
    const message = new Message({ text: data.message, username: data.username });
    try {
      await message.save();
      console.log('Mensaje guardado en la base de datos');
    } catch (error) {
      console.error('Error al guardar el mensaje:', error);
    }

    io.emit('chat message', { message: data.message, username: data.username });
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

//Servidor escuchando
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
