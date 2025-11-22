import pool from '../database/database.js';

export const getPosts = async (req, res) => {
    try{
        const [rows] = await pool.query('SELECT * FROM posts ORDER BY data_criacao DESC');
        res.json(rows);
    } catch (err) {
        console.error(err)
        res.status(500).json({error: 'Erro ao listar Posts.'})
    }
};

export const createPost = async (req, res) => {
    try {
        const id_user = req.user.id;

        const { title, description, category, content, image } = req.body;

        if(!id_user || !title || !description || !category || !content){
           return res.status(400).json({ error: 'Campo(s) obrigatório(s) vazio(s).'});
        }
        
        await pool.query(
            'INSERT INTO posts (id_user, titulo, descricao, categoria, conteudo, imagem) VALUES (?, ?, ?, ?, ?, ?)',
            [id_user, title, description, category, content, image || null ]
        )

        res.status(201).json({message: 'Post criado com sucesso.'});

        } catch (err){
        console.error(err)
        res.status(500).json({error: 'Erro ao criar Post.'})
    }


};

export const myPosts = async (req, res) => {
    try {
        const id_user = req.user.id;

        const [rows] = await pool.query(
            'SELECT * FROM posts WHERE id_user = ?',
            [id_user]
        );

        res.json(rows);

    } catch (err){
        return res.status(500).json({error: 'Erro ao listar posts.'})
    }
};

export const editPost = async (req, res) => {
    try {

        const id_user = req.user.id;

        const {title, description, category, content, image } = req.body;

        const { id } = req.params;

        if(!title || !description || !category || !content){
           return res.status(400).json({ error: 'Campo(s) obrigatório(s) vazio(s).'});
        }

        const [result] = await pool.query('UPDATE posts SET titulo = ?, descricao = ?, categoria = ? , conteudo = ?, imagem = ? WHERE id = ? AND id_user = ?',
        [title, description, category, content, image || null, id, id_user ]);

        if(result.affectedRows === 0){
         return res.status(404).json({ error: 'Post não encontrado ou você não tem permissão para editar.' });
        }

        res.status(200).json({message: 'Post alterado com sucesso.'});
    } catch (err){
        res.status(500).json({error: 'Erro ao editar Post.'})
    }
};

export const deletePost = async (req,res) => {

    try{

        const id_user = req.user.id;

        const { id } = req.params;

        console.log('ID do usuário autenticado: ', id_user);
        console.log('Id do Post a excluir: ', id);

        if (!id) {
            return res.status(400).json({ error: 'O ID do Post é obrigatório.' });
        }


        const [result] = await pool.query(
            'DELETE FROM posts WHERE id = ? AND id_user = ?',
            [id, id_user]
        )

        console.log('Resultado da query: ', result);

        if(result.affectedRows === 0){
         return res.status(404).json({ error: 'Post não encontrado ou você não tem permissão para excluir.' });
        }

        res.status(204).send();

    } catch(err){
        console.log('Erro ao excluir post: ', err)
        res.status(500).json({error: 'Erro ao excluir Post.'})
    }

}

export const search = async (req, res) => {
    
try{
    const { term } = req.query;

    if (!term){
        return res.status(500).json({error: 'Termo de busca é obrigatório.'})
    }

    const [rows] = await pool.query(
    'SELECT *, MATCH(titulo, conteudo) AGAINST (? IN BOOLEAN MODE) AS relevance FROM posts WHERE MATCH(titulo, conteudo) AGAINST (? IN BOOLEAN MODE) OR TITULO LIKE ? ORDER BY relevance DESC',[term, term, `%${term}%`]
    );     
    res.json(rows);
    } catch (err){
        res.status(500).json({error: 'Erro ao buscar Post.'})
    }
};