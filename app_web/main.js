import { main } from './GltfSVApp.js';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDvGDpyknlfhPNQ5AJpr0Xqp9UiloDXeEs",
    authDomain: "gltf-viewer-86cef.firebaseapp.com",
    projectId: "gltf-viewer-86cef",
    storageBucket: "gltf-viewer-86cef.appspot.com",
    messagingSenderId: "485478327370",
    appId: "1:485478327370:web:b99e9a305f8f3f4cc332b3"
};

// Initialize Firebase
initializeApp(firebaseConfig);

main();
