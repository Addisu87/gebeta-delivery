import { Injectable } from '@nestjs/common';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class PhotoService {
  create(createPhotoDto: CreatePhotoDto) {
    return createPhotoDto;
  }

  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }

  update(id: string, updatePhotoDto: UpdatePhotoDto) {
    return { id, ...updatePhotoDto };
  }

  remove(id: string) {
    return { id };
  }

  normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
  }

  appendPhoto(existingPhotos: string[] | undefined, photoPath: string): string[] {
    return [...(existingPhotos ?? []), this.normalizePath(photoPath)];
  }

  setPhoto(photoPath: string): string {
    return this.normalizePath(photoPath);
  }
}
