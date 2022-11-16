const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yrpb3ds.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,
        function (error, decoded) {
            if (error) {
                return res.status(403).send({ message: 'Forbidden access' });
            }
            req.decoded = decoded;
            next();
        })
}

async function run() {
    try {
        const servicesCollection = client.db('heartDoctor').collection('services');
        const reviewsCollection = client.db('heartDoctor').collection('reviews');

        app.get('/homeservices', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const result = await cursor.limit(3).toArray();
            res.send(result);
        })
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.send(service);
        })


        app.get('/review', async (req, res) => {
            let query = {};
            if (req.query.service) {
                query = {
                    service: req.query.service,
                }
            }
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })


        app.get('/reviews', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('Inside orders api', decoded);

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email,
                }
            }
            const cursor = reviewsCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        })

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewsCollection.findOne(query);
            res.send(review);
        })

        app.post('/reviews', verifyJWT, async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        })

        app.patch('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: status,
                }
            }
            const result = await reviewsCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        app.delete('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewsCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(error => console.error(error))

app.post('/jwt', (req, res) => {
    const user = req.body;
    console.log(user);
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
    res.send({ token });
})

app.get('/', (req, res) => {
    res.send('Heart Doctor server is running');
})

app.listen(port, () => {
    console.log(`Heart Doctor server running on ${port}`);
})