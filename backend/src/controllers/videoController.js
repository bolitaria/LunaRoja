const Video = require('../models/Video');

// Obtener todos los videos (público)
const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.findAll({ order: [['publishedAt', 'DESC']] });
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener videos' });
  }
};

// Obtener un video por ID (público)
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video no encontrado' });
    }
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener video' });
  }
};

// Crear un nuevo video (admin)
const createVideo = async (req, res) => {
  try {
    const { title, description, youtubeUrl, thumbnail } = req.body;
    if (!title || !youtubeUrl) {
      return res.status(400).json({ message: 'Título y URL de YouTube son requeridos' });
    }

    const video = await Video.create({ title, description, youtubeUrl, thumbnail });
    res.status(201).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear video' });
  }
};

// Actualizar un video (admin)
const updateVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video no encontrado' });
    }

    const { title, description, youtubeUrl, thumbnail } = req.body;
    await video.update({ title, description, youtubeUrl, thumbnail });
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar video' });
  }
};

// Eliminar un video (admin)
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video no encontrado' });
    }

    await video.destroy();
    res.json({ message: 'Video eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar video' });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
};