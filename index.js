const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('j')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kxy8ozq.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const productCollection = client.db('productDB').collection('product');

    app.get('/product', async(req, res)=>{
        const cur = productCollection.find();
        const result = await cur.toArray();
        res.send(result);
    })

    app.get('/product/:brand', async (req, res)=>{
        const myBrand = req.params.brand;
        const cursor = productCollection.find({
            'brand': myBrand,
        });
        const result = await cursor.toArray();
        console.log(result)
        res.send(result);
    } )

    app.put('/product/:id', async(req, res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = {upsert: true}
        const updatedProduct = req.body;
        const product= {
            $set: {
                name: updatedProduct.name,
                brand: updatedProduct.brand,
                type: updatedProduct.type,
                rating: updatedProduct.rating,
                price: updatedProduct.price,
                image: updatedProduct.image,
                details: updatedProduct.details,
            }
        }
        const result = await productCollection.updateOne(filter, product, options);
        res.send(result);
    })

    app.post('/product', async(req, res)=>{
        const newProduct = req.body;
        console.log(newProduct);
        const result = await productCollection.insertOne(newProduct);
        res.send(result);
    })
    
    app.get('/product/:id', async (req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await productCollection.findOne(query);
        // const result = await cursor.toArray();
        console.log(result)
        res.send(result);
    } )

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, ()=>{
    console.log(`port: ${port}`)
})