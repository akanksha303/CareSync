export interface JwtPayload {
  userId: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export type WorkingHours = {
  [key: string]: { start: string; end: string } | null;
};
