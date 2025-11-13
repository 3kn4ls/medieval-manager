import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import User, { UserRole } from '../models/User';
import { registerSchema, loginSchema } from '../validators/authValidator';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ username: validatedData.username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe',
      });
    }

    // Create new user
    const user = new User({
      ...validatedData,
      role: UserRole.USER, // Default role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        nombre: user.nombre,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          nombre: user.nombre,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validación fallida',
        details: error.errors,
      });
    }

    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar el usuario',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ username: validatedData.username });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        nombre: user.nombre,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          nombre: user.nombre,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validación fallida',
        details: error.errors,
      });
    }

    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
    }

    // Get fresh user data from database
    const userData = await User.findById(user.userId).select('-password');

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: {
        id: userData._id,
        username: userData.username,
        nombre: userData.nombre,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el usuario',
    });
  }
};
