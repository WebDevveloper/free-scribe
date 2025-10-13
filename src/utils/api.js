const express = require('express');
const mysql = require('mysql');
const { pipeline } = require('@xenova/transformers'); // если планируешь выполнять ASR на сервере
const MyTranscriptionPipeline = require('./whisper.worker'); // файл с кодом транскрипции

const app = express();

// Настройка подключения к базе данных
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'free_scribe'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Подключено к базе данных!');
});

// Маршрут для загрузки и обработки аудио
app.post('/transcribe', async (req, res) => {
    const audio = req.body.audio; // Здесь предполагается, что аудио отправляется в теле запроса
    
    try {
        const pipelineInstance = await MyTranscriptionPipeline.getInstance();
        const transcription = await pipelineInstance(audio);

        // Сохранение транскрипции в базе данных
        db.query('INSERT INTO transcriptions SET ?', { text: transcription }, (err, result) => {
            if (err) throw err;
            res.send({ message: 'Транскрипция сохранена', transcriptionId: result.insertId });
        });
    } catch (error) {
        console.error('Ошибка транскрипции:', error.message);
        res.status(500).send({ error: 'Ошибка обработки транскрипции' });
    }
});

app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
