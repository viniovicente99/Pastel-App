import { Router } from 'express';
import { createPost, deletePost, editPost, getPosts, myPosts, search } from '../controller/post.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.get('/all', authenticateToken, getPosts);

router.post('/create', authenticateToken, createPost );

router.get('/my-posts', authenticateToken, myPosts);

router.get('/search', search);

router.patch('/edit/:id', authenticateToken, editPost);

router.delete('/delete/:id', authenticateToken, deletePost)



export default router;