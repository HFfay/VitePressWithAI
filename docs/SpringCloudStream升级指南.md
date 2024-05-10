# SpringCloudStream升级指南


SpringCloudStream中，@EnableBinding注解从3.1版本开始被弃用，取而代之的是函数式编程模型同期被废弃的注解还有下面这些注解：

@Input @Output @EnableBinding @StreamListener

官方例子：https://github.com/spring-cloud/spring-cloud-stream-samples/

这里说明一下怎么从旧版代码到新版代码的改造过程。



## 消息生产者改造

1. yml配置变更

```yaml
spring:
  cloud:
    stream:
      bindings:
        publishSiniCubeEvent:
          content-type: application/json
          destination: publish-sinicube-event-topic
```

改为

```yaml
spring:
  cloud:
    stream:
      bindings:
        ## 新版本固定格式 函数名-{out/in}-{index}
        publishSiniCubeEvent-out-0:
          content-type: application/json
          destination: publish-sinicube-event-topic
```


2. 注解变更

去掉@EnableBinding(Source.class)注解，以及对应的processor消息通道类

3. 代码变更

```JAVA
@Autowired(required = false)
private SiniCubeEventMsgProcessor msgProcessor;

public void publishEvent(SiniCubeEvent event) {
    ...
    
    msgProcessor.output().send(
            MessageBuilder.withPayload(msg)
                    .build()
    );
}
```

改为

```JAVA
@Autowired
private StreamBridge streamBridge;

public void publishEvent(SiniCubeEvent event) {
    ...
    // 注意这里可以直接发送消息体，不需要build了。
    // 另外多了一个参数‘bindingName’，跟配置里的bingdings下的out对应，可以自定义一个参数来动态变更。
    streamBridge.send("publishSiniCubeEvent-out-0", msg);
}
```

## 消息消费者改造


1. yml配置变更

```yaml
spring:
  cloud:
    stream:
      bindings:
        handleSiniCubeEvent:
          content-type: application/json
          group: sinicube-event-trigger-group
          destination: publish-sinicube-event-topic
```

改为

```yaml
spring:
  cloud:
    function:
      # 注意多个监听要用分号分隔（不是逗号），否则无法绑定
      definition: handleSiniCubeEvent
    stream:
      bindings:
        ## 新版本固定格式 函数名-{out/in}-{index}
        handleSiniCubeEvent-in-0:
          content-type: application/json
          group: sinicube-event-trigger-group
          destination: publish-sinicube-event-topic
```

2. 注解变更

去掉@EnableBinding(Sink.class)注解，以及对应的processor消息通道类

3. 代码变更

```JAVA
    @StreamListener(SiniCubeEventConstant.HANDLE_SINICUBE_EVENT_TOPIC)
    public void listener(SiniCubeEventMsgDTO msg){
        log.info("监听到远程事件【{}】", msg);
    }
```

改为

```JAVA
@Bean
public Consumer<Message<SiniCubeEventMsgDTO>> handleSiniCubeEvent() {
    return mqMsg -> {
        SiniCubeEventMsgDTO msg = mqMsg.getPayload();
        log.info("监听到远程事件【{}】", msg);
    };
}
```

**注意:** 这里的函数名为`handleSiniCubeEvent`，与yml中bingdings下的in前面一段对应。

关于函数名相关的配置，参考官方文档：[functional_binding_names](https://docs.spring.io/spring-cloud-stream/docs/current/reference/html/spring-cloud-stream.html#_functional_binding_names)

