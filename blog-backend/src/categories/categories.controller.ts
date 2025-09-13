import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../roles/roles.constants.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  // ...existing code...
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @Post()
  async create(@Body() body: { name: string }) {
    return this.service.create(body.name);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
  // ...existing code...
}