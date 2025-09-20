import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('csrf')
export class CsrfController {
  @Get()
  getToken(@Req() req: any, @Res() res: Response) {
    // S'assurer que le token existe avant de le retourner
    if (!req.session) {
      return res.status(500).json({ error: 'Session not available' });
    }
    
    // Le token sera défini par l'interceptor CSRF avant d'arriver ici
    const token = req.session.csrfToken;
    if (!token) {
      return res.status(500).json({ error: 'CSRF token not generated' });
    }
    
    return res.json({ csrfToken: token });
  }
}
