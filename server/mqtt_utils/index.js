const mqtt = require('mqtt')
const brokerInfo = require('../config.json').MQTTBrokerInfo

module.exports = {
    clientId: brokerInfo.clientId,
    getMQTTConnectionURL: function() {
        return `mqtt://${brokerInfo.host}:${brokerInfo.port}`
    },
    getMQTTClient: function () {
        const client = mqtt.connect(
            this.getMQTTConnectionURL(),
            {
                clientId: this.clientId,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000
            }
        )
        return client
    },
    publish: function(client, topic, message){
        client.publish(topic, message, {qos: 0, retain: false}, (error) => {
            if(error) throw error
            
            console.log(`Send message ${message} to topic ${topic}`)
        })
    }
}