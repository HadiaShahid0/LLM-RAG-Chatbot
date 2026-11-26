import {
  getSemanticCacheCollectionService,
} from "./services/vectorStoreServices.js";

await getSemanticCacheCollectionService();

console.log("Semantic cache collection is ready");