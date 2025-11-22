import pool from '../database/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.RESET_TOKEN_SECRET;




export const register = async (req, res) => {
    try {
       const {name, email, password, confirmPassword } = req.body;

       if (!name || !email || !password || !confirmPassword){
        return res.status(400).json({error: 'Todos os campos são obrigatórios.' });
       }

       if (password !== confirmPassword){
        return res.status(400).json({error: 'As senhas são diferentes.'});
       }

       const [existingUser] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
       )

       if (existingUser.length > 0){
        return res.status(400).json({error: 'Email já cadastrado.'})
       }

       const salt = await bcrypt.genSalt();
       const hashedPassword = await bcrypt.hash(password, salt);

       await pool.query(
        "INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
       );

       res.status(201).json({message: 'Usuário cadastrado com sucesso!'});
        } catch (err){
            console.error(err);
            res.status(500).json({error:'Erro ao cadastrar usuário'});
        }
};

export const forgotPassword = async (req, res) => {

    const { email } = req.body;
    
    try {       

        if (!email){
            return res.status(400).json({ error: 'O E-mail é obrigatório.'});
        }

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.json({
                message: 'Se o e-mail existir, enviaremos instruções.'
            });
        }

        const user = rows[0];

        const token = jwt.sign(
            {id: user.id},
            JWT_SECRET,
            {expiresIn: "15m"}
        );

        res.json({
            resetLink: `/reset-password?token=${token}`,
            token
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Erro interno.'});
    }
};


export const resetPassword = async (req, res) => {

    const { token, newPassword, confirmNewPassword } = req.body;

    if(newPassword !== confirmNewPassword ){
        return res.status(400).json({error: 'As senhas são diferentes.'});
    }

    try {
       const decoded = jwt.verify(token, JWT_SECRET);
       const userId = decoded.id;

       const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(newPassword, salt);

       await pool.query(
        'UPDATE users SET senha = ? WHERE id = ? ',
        [hashedPassword, userId]
       );

       res.json({ message: 'Senha alterada com sucesso.'});

    } catch (err) {

        console.log(err);   
        
        if(err.name === 'TokenExpiredError'){
            return res.status(400).json({ error: 'Token expirado.'});
        }

        return res.status(400).json({ error: 'Token inválido.'});
    };
};

export const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password){
        return res.status(400).json({error: 'Todos os campos são obrigatórios.' });
       }

       const [users] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
       );

       const user = users[0]

       if(!user){
        return res.status(400).json({ error: 'E-mail ou senha incorretos.'});
       }

       const match = await bcrypt.compare(password, user.senha);
        
       if (match){
        const accessToken = jwt.sign({id: user.id, email: user.email, name: user.nome}, 
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d'}
       );
        return res.json({ accessToken: accessToken})
       } else {
        return res.status(400).json({error: 'E-mail ou senha incorretos.'})
       }
        } catch (err){
            console.error(err);
            res.status(500).json({error:'Erro ao realizar login'});
        }

};
