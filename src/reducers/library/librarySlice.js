import { createSlice } from '@reduxjs/toolkit';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFilename } from '../../helpers';
import { imageExport, svgExport } from '../../utils/paper-export';
import { exists } from '@tauri-apps/api/fs';
import { EXPORTS_DIR } from '../../constants';

const initialState = {
  folders: [],
  papers: [],
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    newFolder: (state) => {
      state.folders.push({
        id: uuidv4(),
        name: 'Untitled',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    },
    newPaperInFolder: (state, action) => {
      const folderId = action.payload;
      state.papers.push({
        id: uuidv4(),
        name: 'Untitled',
        folderId: folderId,
        shapes: [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    },
    updateFolderName: (state, action) => {
      const { id, name } = action.payload;
      for (let i = 0; i < state.folders.length; i++) {
        if (state.folders[i].id === id) {
          state.folders[i].name = name;
          state.folders[i].updatedAt = new Date().toISOString();
          break;
        }
      }
    },
    updatePaperName: (state, action) => {
      const { id, name } = action.payload;
      for (let i = 0; i < state.papers.length; i++) {
        if (state.papers[i].id === id) {
          state.papers[i].name = name;
          state.papers[i].updatedAt = new Date().toISOString();
          break;
        }
      }
    },
    setPaperShapes: (state, action) => {
      const { id, shapes } = action.payload;
      for (let i = 0; i < state.papers.length; i++) {
        if (state.papers[i].id === id) {
          state.papers[i].shapes = shapes;
          state.papers[i].updatedAt = new Date().toISOString();
          break;
        }
      }
    },
    deleteFolder: (state, action) => {
      const folderId = action.payload;

      // Delete the folder itself.
      state.folders = state.folders.filter((folder) => folder.id !== folderId);

      // Delete all the corresponding papers.
      state.papers = state.papers.filter((paper) => paper.folderId !== folderId);
    },
    deletePaper: (state, action) => {
      const id = action.payload;
      state.papers = state.papers.filter((paper) => paper.id !== id);
    },
    loadLibrary: (state, action) => {
      if (action.payload) {
        state.folders = action.payload.folders;
        state.papers = action.payload.papers;
      }
    },
    saveLibrary: (state) => {
      invoke('save_library', { libraryState: JSON.stringify(state) });
    },

    // TODO:
    // exportFolder: (state, action) => {
    //   const folderId = action.payload;
    // }
  },
});

export const exportPaper = (payload) => async (dispatch, getState) => {
  const state = getState();
  const { id, exportType } = payload;

  const paper = state.library.papers.find((paper) => paper.id === id);
  const filename = `${sanitizeFilename(paper.name)}.${exportType}`;
  const alreadyExists = await exists(`${filename}`, { dir: EXPORTS_DIR });

  if (alreadyExists) {
    const overwrite = await confirm(`${filename} already exists, overwrite?`);
    if (!overwrite) return;
  }

  let fn = exportType === 'svg' ? svgExport : imageExport;
  fn(paper, filename, payload);
};

export const {
  newFolder,
  newPaperInFolder,
  updateFolderName,
  updatePaperName,
  setPaperShapes,
  deleteFolder,
  deletePaper,
  saveLibrary,
  loadLibrary,
} = librarySlice.actions;

export default librarySlice.reducer;
