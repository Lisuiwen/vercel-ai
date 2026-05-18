import {
  embed,
  embedMany,
  cosineSimilarity,
  type Embedding,
  type EmbeddingModel,
} from 'ai';
export interface Route<NAME extends string> {
  name: NAME;
  values: string[];
}

/**
 * 根据值与一组集群中的值的距离来路由值。
 * 当距离低于某个阈值时，该值被归类为属于该路线，
 * 并返回路线名称。否则，该值被分类为空。
 */
export class SemanticRouter<ROUTES extends Array<Route<string>>> {
  readonly routes: ROUTES;
  readonly embeddingModel: EmbeddingModel;
  readonly similarityThreshold: number;

  private routeValues:
    | Array<{ routeName: string; routeValue: string; embedding: Embedding }>
    | undefined;

  constructor({
    routes,
    embeddingModel,
    similarityThreshold,
  }: {
    routes: ROUTES;
    embeddingModel: EmbeddingModel;
    similarityThreshold: number;
  }) {
    this.routes = routes;
    this.embeddingModel = embeddingModel;
    this.similarityThreshold = similarityThreshold;
  }

  private async getRouteValues(): Promise<
    Array<{ embedding: Embedding; routeValue: string; routeName: string }>
  > {
    if (this.routeValues != null) {
      return this.routeValues;
    }

    this.routeValues = [];

    for (const route of this.routes) {
      const { embeddings } = await embedMany({
        model: this.embeddingModel,
        values: route.values,
      });

      for (let i = 0; i < embeddings.length; i++) {
        this.routeValues.push({
          routeName: route.name,
          routeValue: route.values[i],
          embedding: embeddings[i],
        });
      }
    }

    return this.routeValues;
  }

  async route(value: string) {
    const { embedding } = await embed({ model: this.embeddingModel, value });
    const routeValues = await this.getRouteValues();

    const allMatches: Array<{
      similarity: number;
      routeValue: string;
      routeName: string;
    }> = [];

    for (const routeValue of routeValues) {
      const similarity = cosineSimilarity(embedding, routeValue.embedding);

      if (similarity >= this.similarityThreshold) {
        allMatches.push({
          similarity,
          routeValue: routeValue.routeValue,
          routeName: routeValue.routeName,
        });
      }
    }

    // 排序（相似度最高的优先）
    allMatches.sort((a, b) => b.similarity - a.similarity);

    return allMatches.length > 0
      ? (allMatches[0].routeName as unknown as RouteNames<ROUTES>)
      : null;
  }
}

type RouteNames<ROUTES> =
  ROUTES extends Array<Route<infer NAME>> ? NAME : never;
