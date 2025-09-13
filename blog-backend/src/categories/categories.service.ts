import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>
  ) {}

// ...existing code...
async create(name: string) {
  const category = this.repo.create({ name });
  const saved = await this.repo.save(category);
  return { success: true, message: 'Catégorie créée', data: saved };
}

async findAll() {
  const categories = await this.repo.find({ relations: ['articles'] });
  return { success: true, message: 'Liste des catégories récupérée', data: categories };
}

async delete(id: string) {
  const result = await this.repo.delete(id);
  if (result.affected === 0) throw new NotFoundException('Catégorie introuvable');
  return { success: true, message: 'Catégorie supprimée avec succès' };
}
// ...existing code...
}