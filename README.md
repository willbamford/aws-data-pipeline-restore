# AWS Data Pipeline Restore

Takes data in the format currently output by [AWS Data Pipeline DynamoDB export](http://docs.aws.amazon.com/datapipeline/latest/DeveloperGuide/dp-importexport-ddb-part2.html) and writes this to local DynamoDB database using batch write (25 items at a time).

## Usage

```bash
AWS_REGION=eu-west-1 FILE=./export-file.json TABLE=MyTableName node index.js
```

## Why?

For some reason the format exported by AWS Data Pipeline job differs to what's required by SDK params to `batchWriteItem`. In particular attribute keys exported have initial lowercase whereas SDK requires all caps e.g. `bOOL` -> `BOOL`.
