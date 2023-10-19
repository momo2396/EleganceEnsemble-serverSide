const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('Elegance Ensemble Server is Running')
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
    const cartCollection = client.db('productDB').collection('cart');

    app.get('/product/:brand', async (req, res)=>{
        const myBrand = req.params.brand;
        const cursor = productCollection.find({
            'brand': myBrand,
        });
        const result = await cursor.toArray();
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
        const result = await productCollection.insertOne(newProduct);
        res.send(result);
    })

    app.post('/add-to-cart', async(req, res)=>{
        const id = req.query.id;
        const email = req.query.email;
        const exist = await cartCollection.findOne({
            'email':email
        })
        if(exist){
            const {cart} =exist;
            if(cart.includes(id)){
                res.send({message: 'Product already added', success:false}); 
                return
            }
            const query = {email : email}
            const updateDoc = {
                $set:{
                    cart: [
                        ...cart, id
                    ]
                }
            }
            const result = await cartCollection.updateOne(query, updateDoc, {upsert: true});
            res.send({message: 'Cart updated Successfully', success:true}); 
        }

        else{
            const newCart = {
                email : email,
                cart: [id]
            };
            const result = await cartCollection.insertOne(newCart);
            res.send({message: 'New cart created', success: true}); 
        }

    })

    app.delete('/delete-from-cart', async(req, res)=>{
        const id = req.query.id;
        const email = req.query.email;
        const exist = await cartCollection.findOne({
            'email':email
        })
            const {cart} =exist;
            const query = {email : email}
            const remaining = cart.filter(item=>item!==id)
            if(remaining.length >0){
                const updateDoc = {
                    $set:{
                        cart: [
                            ...remaining
                        ]
                    }
                }
                const result = await cartCollection.updateOne(query, updateDoc, {upsert: true});
                res.send({message: 'Product Removed Successfully', success:true}); 
            }
            else{
                const result = await cartCollection.deleteOne(query)
                res.send({message: 'Cart Cleared Successfully', success:true}); 
            }
        })
    
    app.get('/single-product', async (req, res)=>{
        const id = req.query.id;
        const query = {_id: new ObjectId(id)};
        const result =  await productCollection.findOne(query);
        res.send(result);
    } )

    app.get('/my-cart', async(req, res)=>{
        const email = req.query.email;
        const query = {email:email}
        const result = await cartCollection.findOne(query);
        res.send(result)

    })

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