import express from 'express';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';

const app = express();

app.use(express.json());

app.use('/users', userRoutes);
app.use('/posts', postRoutes);



export default app;