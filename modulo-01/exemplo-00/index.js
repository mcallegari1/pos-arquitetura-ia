import tf from '@tensorflow/tfjs-node';

async function trainModel(inputXs, outputYs) {

    const model = tf.sequential();

    model.add(tf.layers.dense({ inputShape: [7], units: 80, activation: 'relu' }));

    model.add(tf.layers.dense({ units: 3, activation: 'softmax'}));

    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy']}); 

    await model.fit(
        inputXs,
        outputYs,
        {
            verbose: 0,
            epochs: 100,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, log) => console.log(
                    `Epoch: ${epoch}: loss = ${log.loss}`
                )
            }
        }
    )
    
    return model;
}

async function predict(model, pessoa) {

    const tfInput = tf.tensor2d(pessoa);

    const pred = model.predict(tfInput);
    const predArr = await pred.array();
    
    return predArr[0].map((prob, index) => ({prob, index}));
    
}

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, azul, vermelho, verde, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [0.33, 1, 0, 0, 1, 0, 0], // Erick
//     [0, 0, 1, 0, 0, 1, 0],    // Ana
//     [1, 0, 0, 1, 0, 0, 1]     // Carlos
// ]

// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
    [0.33, 1, 0, 0, 1, 0, 0],    // Erick
    [0,    0, 1, 0, 0, 1, 0],    // Ana
    [1,    0, 0, 1, 0, 0, 1]     // Carlos
];

// Labels das categorias a serem previstas (one-hot encoded)
// [premium, medium, basic]
const labelsNomes = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
    [1, 0, 0], // premium - Erick
    [0, 1, 0], // medium - Ana
    [0, 0, 1]  // basic - Carlos
];

// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado)
const outputYs = tf.tensor2d(tensorLabels)

inputXs.print();
outputYs.print();

const model = await trainModel(inputXs, outputYs);

const pessoa = { nome: 'zé', idade: '28', cor: 'verde', localizacao: 'Curitiba'};

const pessoaTensorNormalizada = [
    [
        // reflete os valores acima normalizados
        0.2,       // idade normalizada
        1,         // cor azul 
        0,         // cor vermelho
        0,         // cor verde
        0,         // São Paulo
        1,         // Rio
        0          // Curitiba
    ]
];

const predictions = await predict(model, pessoaTensorNormalizada);
const results = predictions
    .sort((a,b) => b.prob - a.prob)
    .map(p => `${labelsNomes[p.index]} (${(p.prob * 100).toFixed(2)}%)`)
    .join('\n')
;

console.log(results);