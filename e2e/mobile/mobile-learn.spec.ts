import { expect, test } from '@playwright/test';

import currData from '../../shared/config/curriculum.json';
import { orderedSuperBlockInfo } from '../../tools/scripts/build/build-external-curricula-data';
import { SuperBlocks } from '../../shared/config/curriculum';

interface Curriculum {
  [key: string]: {
    blocks: {
      [key: string]: {
        challenges: {
          id: string;
          title: string;
          block: string;
          challengeType: number;
        }[];
        meta: {
          name: string;
        };
      };
    };
  };
}

// non editor superblocks should be skipped because they are not
// checked if they are compatible with the mobile app.

const nonEditorSB = [
  SuperBlocks.PythonForEverybody,
  SuperBlocks.DataAnalysisPy,
  SuperBlocks.MachineLearningPy,
  SuperBlocks.CollegeAlgebraPy,
  SuperBlocks.A2English,
  SuperBlocks.B1English
];

const publicSB = orderedSuperBlockInfo
  .filter(sb => sb.public === true && !nonEditorSB.includes(sb.dashedName))
  .map(sb => sb.dashedName);

const removeCertSuperBlock = (currData: Curriculum): Curriculum => {
  const copy = currData;
  delete copy['certifications'];
  return copy;
};

const typedCurriculum = removeCertSuperBlock(currData as never);

test.describe('Test challenges in mobile', () => {
  for (const superBlock of publicSB) {
    for (const currBlock of Object.values(
      typedCurriculum[superBlock]['blocks']
    )) {
      test.describe(`SuperBlock: ${superBlock} - Block: ${currBlock['meta']['name']}`, () => {
        for (const currChallenge of currBlock['challenges']) {
          // Skip non-editor challenges
          if (![0, 1, 5, 6, 14].includes(currChallenge['challengeType'])) {
            continue;
          }

          test(`Challenge: ${currChallenge['title']}(${currChallenge['id']})`, async ({
            page
          }) => {
            const logMsges: string[] = [];
            page.on('console', msg => {
              logMsges.push(msg.text());
            });
            await page.goto(
              `/${superBlock}/${currChallenge['block']}/${currChallenge['id']}`
            );
            expect(logMsges).toContain('completed');
          });
        }
      });
    }
  }
});
