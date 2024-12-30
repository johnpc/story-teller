import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { generateImage, MODEL_ID } from "./functions/generateImage/resource";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { storage, knowledgeBaseBucket } from "./storage/resource";
import { getNews } from "./functions/getNews/resource";

const KB_REGION = "us-west-2";

// Replace with your own Knowledge Base ID
// https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-create.html
const KB_ID = "RPDVYMXFRH";

const backend = defineBackend({
  auth,
  data,
  generateImage,
  storage,
  getNews,
  knowledgeBaseBucket,
});

backend.generateImage.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [`arn:aws:bedrock:*::foundation-model/${MODEL_ID}`],
  })
);

const KnowledgeBaseDataSource =
  backend.data.resources.graphqlApi.addHttpDataSource(
    "KnowledgeBaseDataSource",
    `https://bedrock-agent-runtime.${KB_REGION}.amazonaws.com`,
    {
      authorizationConfig: {
        signingRegion: KB_REGION,
        signingServiceName: "bedrock",
      },
    }
  );

KnowledgeBaseDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    resources: [`arn:aws:bedrock:${KB_REGION}:*:knowledge-base/${KB_ID}`],
    actions: ["bedrock:Retrieve"],
  })
);
