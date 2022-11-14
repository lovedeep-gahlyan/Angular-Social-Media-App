import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NgForm } from '@angular/forms';
import { config, finalize } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { readAndCompressImage } from 'browser-image-resizer';
import { imageConfig } from 'src/utils/config';
import { uuidv4 } from '@firebase/util';

@Component({
  selector: 'app-addpost',
  templateUrl: './addpost.component.html',
  styleUrls: ['./addpost.component.css'],
})
export class AddpostComponent implements OnInit {
  locationName!: string;
  description!: string;
  picture!: string;
  user: any;
  uploadPercent!: number;

  constructor(
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private toastr: ToastrService,
    private auth: AuthService,
    private router: Router
  ) {
    auth.getUser().subscribe((user) => {
      this.db
        .object(`/users/${user?.uid}`)
        .valueChanges()
        .subscribe((user) => {
          this.user = user;
        });
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    const uid = uuidv4();
    this.db
      .object(`/posts/${uid}`)
      .set({
        id: uid,
        locationName: this.locationName,
        description: this.description,
        picture: this.picture,
        by: this.user.name,
        instaId: this.user.instaUserName,
        date: Date.now(),
      })
      .then(() => {
        this.toastr.success('Post added successfully');
        this.router.navigateByUrl('/');
      })
      .catch((err) => {
        this.toastr.error('Oops!');
      });
  }

  async uploadFile(event: any) {
    const file = event.target.files[0];
    let resizedImage = await readAndCompressImage(file, imageConfig);
    const filePath = file.name;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, resizedImage);
    task.percentageChanges().subscribe((percentage: any) => {
      this.uploadPercent = percentage;
    });
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            this.picture = url;
            this.toastr.success('Image Upload Success');
          });
        })
      )
      .subscribe();
  }
}
