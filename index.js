require("dotenv").config();
require("./mongo");
require("./instrument.js");

const Sentry = require("@sentry/node");
const express = require("express");
const app = express();
const cors = require("cors");
const Note = require("./models/Note");
const notFound = require("./middleware/notFound.js");
const handleErrors = require("./middleware/handleErrors.js");

app.use(cors());
app.use(express.json());
app.use("/images", express.static("images"));

Sentry.init({
  dsn: "https://8ce015f88f08fcbfba57a299fd41831b@o4509481471770624.ingest.us.sentry.io/4509481474064384",

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});

const notes = [];

app.get("/", (request, response) => {
  response.send("<h1>Hello World</h1>");
});

app.get("/api/notes", (request, response) => {
  Note.find({}).then((notes) => {
    response.json(notes);
  });
});

app.get("/api/notes/:id", (request, response, next) => {
  const { id } = request.params;
  Note.findById(id)
    .then((note) => {
      if (note) {
        return response.json(note);
      }
    })
    .catch(next);
});

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.put("/api/notes/:id", (request, response, next) => {
  const { id } = request.params;
  const note = request.body;

  const newNoteInfo = {
    content: note.content,
    important: note.important,
  };

  Note.findByIdAndUpdate(id, newNoteInfo, { new: true }).then((result) => {
    response.json(result);
  });
});

app.delete("/api/notes/:id", (request, response, next) => {
  const { id } = request.params;

  Note.findByIdAndDelete(id)
    .then(() => {
      response.status(204).end();
    })
    .catch(next);
});

app.post("/api/notes", (request, response, next) => {
  const note = request.body;

  if (!note.content) {
    return response.status(400).json({
      error: "required 'content' is missing",
    });
  }

  const newNote = new Note({
    content: note.content,
    date: new Date(),
    important: note.important || false,
  });

  newNote
    .save()
    .then((savedNote) => {
      response.json(savedNote);
    })
    .catch(next);
});

app.use(notFound);

Sentry.setupExpressErrorHandler(app);

app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.listen(3001);

app.use(handleErrors);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
