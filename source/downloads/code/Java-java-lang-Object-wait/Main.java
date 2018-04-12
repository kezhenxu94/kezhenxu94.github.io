public class Main {
    public static void main(String[] args) {
        final Resources<Integer> resources = new Resources<>();
        final Consumer<Integer> consumer0 = new Consumer<>(resources);
        final Consumer<Integer> consumer1 = new Consumer<>(resources);
        final IntegerProducer producer = new IntegerProducer(resources);

        new Thread(consumer0).start();
        new Thread(consumer1).start();
        new Thread(producer).start();
    }
}

