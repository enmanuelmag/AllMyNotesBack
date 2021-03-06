import * as yup from 'yup';
import async from 'async';
import firebase from 'firebase';
import { v4 as uuid } from 'uuid';

import db from '../database';
import { Callback } from '../interfaces';

export const schema = {
  create: yup.object().shape({
    title: yup.string().required(),
    authorId: yup.number().required(),
    authorName: yup.string().required(),
    content: yup.string().required(),
    tags: yup.array().of(yup.string()).required(),
    shared: yup.array().of(yup.number()).required(),
    links: yup.array().of(yup.object().shape({
      label: yup.string().required(),
      url: yup.string().required()
    }))
  }),
  update: yup.object().shape({
    title: yup.string(),
    authorId: yup.number(),
    authorName: yup.string(),
    content: yup.string(),
    tags: yup.array().of(yup.string()),
    shared : yup.array().of(yup.number()),
    links : yup.array().of(yup.object().shape({
      label : yup.string(),
      url : yup.string()
    })),
  }),
  get: yup.object().shape({
    admin: yup.boolean().required(),
    userId: yup.number().required()
  })
};

class Note {

  static get(params: any, callback: Callback) {
    console.log('Note params: ', params);
    return async.waterfall([
      (cb: Callback) => {
        let collection: any = db.collection('notes');
        params.admin = params.admin === 'true';
        if (!params.admin) {
          collection = collection.where('shared', 'array-contains', Number(params.userId));
        }
        return collection.get()
          .then((querySnapshot: any) => {
            const data: Array<any> = [];
            querySnapshot.forEach((doc: any) => {
              data.push(doc.data());
            });
            return cb(null, data);
          })
          .catch((error: any) => cb({
            error,
            status: 500,
            message: 'Error getting all notes'
          }));
      }
    ], (error, result) => {
      if (error) {
        return callback(error);
      }
      return callback(null, result);
    });
  }

  static create(note: any, callback: Callback) {
    note = {
      ...note,
      noteId: uuid(),
      createdAt: firebase.firestore.Timestamp.now()
    };
    console.log('Note data: ', note);
    return async.waterfall([
      (cb: Callback) => db
        .collection('notes')
        .doc(note.noteId)
        .set(note)
        .then(() => cb(null, note))
        .catch(error => cb({
          error,
          status: 500,
          message: 'Error adding note'
        }))
    ], (error, result) => {
      if (error) {
        return callback(error);
      }
      return callback(null, result);
    });
  }

  static async update(noteId: string, note: any) {
    note = {
      ...note,
      updatedAt: firebase.firestore.Timestamp.now()
    };
    console.log('Note id: ', noteId);
    console.log('Note update data: ', note);
    const document = db.collection('notes').doc(noteId);
    await document.update(note);
    return (await document.get()).data();
  }

  static async delete(noteId: string) {
    console.log('Note id: ', noteId);
    const document = db.collection('notes').doc(noteId);
    const deletedNote = await document.get();
    await document.delete();
    return deletedNote.data();
  }
}

export default Note;
