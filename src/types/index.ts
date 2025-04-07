export interface Product {
  _id: string;
  productSearchString: string;
  productName: string;
  award: string;
  category: string;
  cons: string[];
  createdAt: string;
  image: string;
  link: string;
  priceRange: string;
  pros: string[];
  ranking: number;
  review: string;
  shortSummary: string;
  slug: string;
  updatedAt: string;
}

export interface ComparisonReview {
  _id: string;
  reviewTitle: string;
  comparisonReview: string;
  createdAt: string;
  metaDescription: string;
  metaTitle: string;
  products: { productId: string }[];
  reviewSummary: string;
  slug: string;
  tags: string[];
  updatedAt: string;
  category: string;
}