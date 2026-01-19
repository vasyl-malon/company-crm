export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'supersecretkey',
  expiresIn: '1h',
};
