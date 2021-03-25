import express from 'express';
const app = express();

import { ok } from './router';

// CORS
app.use((_req: any, res: any, next: any) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept',
	);
	next();
});

app.get('/', ok);

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Listening on port ${port}.`);
});

function errorHandler(err: any, _req: any, res: any, next: any) {
	res.status(400).end();
	next(err);
}
