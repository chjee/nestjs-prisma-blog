import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

type AuthenticatedUser = Omit<User, 'password'>;
type JwtLoginUser = Pick<AuthenticatedUser, 'id' | 'name' | 'role'>;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    let user: User;

    try {
      user = await this.userService.findUser({ email });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return null;
    }

    const { password: _password, ...authenticatedUser } = user;
    void _password;
    return authenticatedUser;
  }

  async login(user: JwtLoginUser) {
    const payload = { name: user.name, role: user.role, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
